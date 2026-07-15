package chimps

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/go/generated/api"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestStudioOperationsAgainstPostgres(t *testing.T) {
	databaseURL := os.Getenv("INTEGRATION_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("INTEGRATION_DATABASE_URL is not configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("create integration pool: %v", err)
	}
	defer pool.Close()

	const fixtureTitle = "Codex studio integration strategy"
	const secondFixtureTitle = "Codex studio integration ownership"
	const fixtureMapID = "codex-studio-integration-map"
	cleanupStudioFixtures(t, ctx, pool, fixtureTitle, secondFixtureTitle, fixtureMapID)
	defer cleanupStudioFixtures(t, context.Background(), pool, fixtureTitle, secondFixtureTitle, fixtureMapID)

	var mapID int64
	if err := pool.QueryRow(ctx, `
		insert into public.maps (name, difficulty, nk_map_id)
		values ('Codex Integration Map', null, $1)
		returning id
	`, fixtureMapID).Scan(&mapID); err != nil {
		t.Fatalf("create fixture map: %v", err)
	}
	modeID := requiredFixtureID(t, ctx, pool, "select id from public.game_modes where name = 'CHIMPS'")
	heroID := requiredFixtureID(t, ctx, pool, "select id from public.towers where category = 'Hero' order by id limit 1")
	towerID := requiredFixtureID(t, ctx, pool, "select id from public.towers where category <> 'Hero' order by id limit 1")

	store := &postgresStore{pool: pool}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	handler := newHandler(testSecret, store, nil, logger)

	response := studioRequest(t, handler, http.MethodGet, "/studio/maps", nil, http.StatusOK)
	var mapsResponse struct {
		Maps []chimpsapi.MapRow `json:"maps"`
	}
	decodeResponse(t, response, &mapsResponse)
	if len(mapsResponse.Maps) == 0 {
		t.Fatal("studio maps response was empty")
	}

	strategyID := createIntegrationStrategy(t, handler, fixtureTitle, mapID, modeID, heroID)
	secondStrategyID := createIntegrationStrategy(t, handler, secondFixtureTitle, mapID, modeID, heroID)
	studioRequest(t, handler, http.MethodGet, fmt.Sprintf("/studio/strategies/%d", strategyID), nil, http.StatusOK)
	studioRequest(t, handler, http.MethodGet, "/studio/strategies", nil, http.StatusOK)

	normalPlacement := createIntegrationPlacement(t, handler, strategyID, towerID, 0.25, 0.75)
	heroPlacement := createIntegrationPlacement(t, handler, strategyID, heroID, 0.5, 0.5)
	secondPlacement := createIntegrationPlacement(t, handler, secondStrategyID, towerID, 0.1, 0.1)

	duplicateHero := studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/placements", strategyID), map[string]any{
		"tower_id": heroID, "pos_x": 0.6, "pos_y": 0.6,
	}, http.StatusBadRequest)
	assertErrorCode(t, duplicateHero, "hero_already_placed")

	heroCrosspath := studioRequest(t, handler, http.MethodPatch, fmt.Sprintf("/studio/strategies/%d/placements/%d", strategyID, heroPlacement), map[string]any{
		"final_path": "0-0-0",
	}, http.StatusBadRequest)
	assertErrorCode(t, heroCrosspath, "hero_crosspath")

	foreignPlacement := studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps", strategyID), map[string]any{
		"round_number": 10, "action": "place", "placement_id": secondPlacement,
		"target_path": nil, "description": nil,
	}, http.StatusBadRequest)
	assertErrorCode(t, foreignPlacement, "placement_not_owned")

	heroPath := studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps", strategyID), map[string]any{
		"round_number": 10, "action": "place", "placement_id": heroPlacement,
		"target_path": "0-0-0", "description": nil,
	}, http.StatusBadRequest)
	assertErrorCode(t, heroPath, "hero_target_path")

	createStepBody := map[string]any{
		"round_number": 10, "action": "place", "placement_id": normalPlacement,
		"target_path": "0-0-0", "description": "First",
	}
	studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps", strategyID), createStepBody, http.StatusOK)
	createStepBody["round_number"] = 11
	createStepBody["description"] = "Second"
	studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps", strategyID), createStepBody, http.StatusOK)

	stepIDs := integrationStepIDs(t, ctx, pool, strategyID)
	studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps/%d/move", strategyID, stepIDs[0]), map[string]any{"direction": "up"}, http.StatusOK)
	studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/steps/%d/move", strategyID, stepIDs[1]), map[string]any{"direction": "up"}, http.StatusOK)
	reordered := integrationStepIDs(t, ctx, pool, strategyID)
	if reordered[0] != stepIDs[1] || reordered[1] != stepIDs[0] {
		t.Fatalf("steps were not reordered: before=%v after=%v", stepIDs, reordered)
	}

	studioRequest(t, handler, http.MethodPatch, fmt.Sprintf("/studio/strategies/%d/steps/%d", strategyID, int64(9_999_999)), createStepBody, http.StatusOK)
	studioRequest(t, handler, http.MethodDelete, fmt.Sprintf("/studio/strategies/%d/placements/%d", strategyID, normalPlacement), nil, http.StatusNoContent)
	if count := integrationCount(t, ctx, pool, "select count(*) from public.steps where strategy_id = $1", strategyID); count != 0 {
		t.Fatalf("placement cascade left %d steps", count)
	}

	initialHero := getIntegrationHero(t, handler, heroID)
	updatedProfile := heroProfileInput(initialHero.Hero)
	updatedProfile.SynergyTowerIds = []int64{towerID}
	updatedProfile.SynergyDescriptions = []string{"Integration synergy"}
	studioRequest(t, handler, http.MethodPut, fmt.Sprintf("/studio/heroes/%d/profile", heroID), updatedProfile, http.StatusOK)

	var synergyID int64
	var synergyCreatedAt time.Time
	if err := pool.QueryRow(ctx, `
		select id, created_at
		from public.tower_synergies
		where tower_a_id = least($1::bigint, $2::bigint)
		  and tower_b_id = greatest($1::bigint, $2::bigint)
	`, heroID, towerID).Scan(&synergyID, &synergyCreatedAt); err != nil {
		t.Fatalf("load created synergy: %v", err)
	}

	currentHero := getIntegrationHero(t, handler, heroID)
	studioRequest(t, handler, http.MethodPut, fmt.Sprintf("/studio/heroes/%d/profile", heroID), heroProfileInput(currentHero.Hero), http.StatusOK)
	var retainedID int64
	var retainedCreatedAt time.Time
	if err := pool.QueryRow(ctx, `
		select id, created_at
		from public.tower_synergies
		where tower_a_id = least($1::bigint, $2::bigint)
		  and tower_b_id = greatest($1::bigint, $2::bigint)
	`, heroID, towerID).Scan(&retainedID, &retainedCreatedAt); err != nil {
		t.Fatalf("load retained synergy: %v", err)
	}
	if retainedID != synergyID || !retainedCreatedAt.Equal(synergyCreatedAt) {
		t.Fatalf("synergy metadata changed: before=(%d,%s) after=(%d,%s)", synergyID, synergyCreatedAt, retainedID, retainedCreatedAt)
	}

	studioRequest(t, handler, http.MethodPut, fmt.Sprintf("/studio/heroes/%d/profile", heroID), heroProfileInput(initialHero.Hero), http.StatusOK)
	studioRequest(t, handler, http.MethodDelete, fmt.Sprintf("/studio/strategies/%d", strategyID), nil, http.StatusOK)
	if count := integrationCount(t, ctx, pool, "select count(*) from public.placements where strategy_id = $1", strategyID); count != 0 {
		t.Fatalf("strategy cascade left %d placements", count)
	}
}

func studioRequest(t *testing.T, handler http.Handler, method string, path string, body any, status int) *httptest.ResponseRecorder {
	t.Helper()
	var encoded []byte
	var err error
	if body != nil {
		encoded, err = json.Marshal(body)
		if err != nil {
			t.Fatalf("encode %s %s body: %v", method, path, err)
		}
	}
	request := httptest.NewRequest(method, path, bytes.NewReader(encoded))
	request.Header.Set("Authorization", "Bearer "+testSecret)
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != status {
		t.Fatalf("%s %s returned %d, want %d: %s", method, path, response.Code, status, response.Body.String())
	}
	return response
}

func createIntegrationStrategy(t *testing.T, handler http.Handler, title string, mapID int64, modeID int64, heroID int64) int64 {
	t.Helper()
	response := studioRequest(t, handler, http.MethodPost, "/studio/strategies", map[string]any{
		"map_id": mapID, "game_mode_id": modeID, "title": title, "description": nil,
		"hero_id": heroID, "source_url": nil, "verified_version": nil,
		"exec_difficulty": nil, "status": "draft",
	}, http.StatusOK)
	var created chimpsapi.IdResponse
	decodeResponse(t, response, &created)
	return created.Id
}

func createIntegrationPlacement(t *testing.T, handler http.Handler, strategyID int64, towerID int64, x float64, y float64) int64 {
	t.Helper()
	response := studioRequest(t, handler, http.MethodPost, fmt.Sprintf("/studio/strategies/%d/placements", strategyID), map[string]any{
		"tower_id": towerID, "pos_x": x, "pos_y": y,
	}, http.StatusCreated)
	var created chimpsapi.PlacementRow
	decodeResponse(t, response, &created)
	return created.Id
}

func getIntegrationHero(t *testing.T, handler http.Handler, heroID int64) chimpsapi.StudioHeroEditor {
	t.Helper()
	response := studioRequest(t, handler, http.MethodGet, fmt.Sprintf("/studio/heroes/%d", heroID), nil, http.StatusOK)
	var hero chimpsapi.StudioHeroEditor
	decodeResponse(t, response, &hero)
	return hero
}

func heroProfileInput(hero chimpsapi.StudioHero) chimpsapi.HeroProfileInput {
	input := chimpsapi.HeroProfileInput{
		Description: hero.Description, BaseCost: hero.BaseCost, AttackStyle: hero.AttackStyle,
		XpRatio: hero.XpRatio, TechnicalDescription: hero.TechnicalDescription,
		ProfileSourceUrl:    hero.ProfileSourceUrl,
		SynergyTowerIds:     make([]int64, 0, len(hero.Synergies)),
		SynergyDescriptions: make([]string, 0, len(hero.Synergies)),
	}
	for _, synergy := range hero.Synergies {
		input.SynergyTowerIds = append(input.SynergyTowerIds, synergy.TowerId)
		description := ""
		if synergy.Description != nil {
			description = *synergy.Description
		}
		input.SynergyDescriptions = append(input.SynergyDescriptions, description)
	}
	return input
}

func requiredFixtureID(t *testing.T, ctx context.Context, pool *pgxpool.Pool, query string) int64 {
	t.Helper()
	var id int64
	if err := pool.QueryRow(ctx, query).Scan(&id); err != nil {
		t.Fatalf("load fixture id: %v", err)
	}
	return id
}

func integrationStepIDs(t *testing.T, ctx context.Context, pool *pgxpool.Pool, strategyID int64) []int64 {
	t.Helper()
	rows, err := pool.Query(ctx, "select id from public.steps where strategy_id = $1 order by order_index", strategyID)
	if err != nil {
		t.Fatalf("list integration step ids: %v", err)
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			t.Fatalf("scan integration step id: %v", err)
		}
		ids = append(ids, id)
	}
	if len(ids) != 2 {
		t.Fatalf("got %d integration steps, want 2", len(ids))
	}
	return ids
}

func integrationCount(t *testing.T, ctx context.Context, pool *pgxpool.Pool, query string, argument any) int {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, query, argument).Scan(&count); err != nil {
		t.Fatalf("count integration rows: %v", err)
	}
	return count
}

func assertErrorCode(t *testing.T, response *httptest.ResponseRecorder, expected string) {
	t.Helper()
	var envelope chimpsapi.ErrorResponse
	decodeResponse(t, response, &envelope)
	if envelope.Code != expected {
		t.Fatalf("error code was %q, want %q", envelope.Code, expected)
	}
}

func decodeResponse(t *testing.T, response *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(response.Body.Bytes(), target); err != nil {
		t.Fatalf("decode response %q: %v", response.Body.String(), err)
	}
}

func cleanupStudioFixtures(t *testing.T, ctx context.Context, pool *pgxpool.Pool, titles ...string) {
	t.Helper()
	if len(titles) != 3 {
		t.Fatal("cleanupStudioFixtures requires two titles and one map id")
	}
	if _, err := pool.Exec(ctx, "delete from public.strategies where title = any($1::text[])", titles[:2]); err != nil {
		t.Fatalf("cleanup fixture strategies: %v", err)
	}
	if _, err := pool.Exec(ctx, "delete from public.maps where nk_map_id = $1", titles[2]); err != nil {
		t.Fatalf("cleanup fixture map: %v", err)
	}
}
