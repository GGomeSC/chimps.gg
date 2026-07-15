package chimps

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"slices"
	"testing"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/go/generated/api"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPublicOperationsAgainstPostgres(t *testing.T) {
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

	cleanupPublicFixtures(t, ctx, pool)
	defer cleanupPublicFixtures(t, context.Background(), pool)
	fixture := seedPublicFixtures(t, ctx, pool)
	handler := newHandler(testSecret, &postgresStore{pool: pool}, nil, slog.New(slog.NewTextHandler(io.Discard, nil)))

	references := publicResponse[chimpsapi.PublicReferences](t, handler, "/public/references", http.StatusOK)
	if !slices.ContainsFunc(references.Maps, func(item chimpsapi.PublicMap) bool { return item.Id == fixture.mapID }) ||
		!slices.ContainsFunc(references.Heroes, func(item chimpsapi.PublicHeroReference) bool { return item.Id == fixture.heroID }) {
		t.Fatal("public references omitted fixture map or hero")
	}

	versions := publicResponse[struct {
		Versions []string `json:"versions"`
	}](t, handler, "/public/versions", http.StatusOK)
	if !slices.Equal(versions.Versions, []string{"99.2", "99.1"}) {
		t.Fatalf("versions were not naturally sorted: %v", versions.Versions)
	}

	latest := publicResponse[chimpsapi.PublicStrategiesResponse](t, handler, "/public/latest?limit=6", http.StatusOK)
	if len(latest.Strategies) != 6 || slices.ContainsFunc(latest.Strategies, func(item chimpsapi.PublicStrategySummary) bool { return item.Id == fixture.draftID }) {
		t.Fatalf("latest response did not contain six ready strategies: %+v", latest.Strategies)
	}

	firstPage := publicResponse[chimpsapi.PublicStrategyPage](t, handler, "/public/strategies", http.StatusOK)
	if len(firstPage.Strategies) != publicPageSize || firstPage.NextCursor == nil {
		t.Fatalf("first discovery page was not paginated: count=%d cursor=%v", len(firstPage.Strategies), firstPage.NextCursor)
	}
	secondPage := publicResponse[chimpsapi.PublicStrategyPage](t, handler, fmt.Sprintf("/public/strategies?cursor=%d", *firstPage.NextCursor), http.StatusOK)
	if len(secondPage.Strategies) != 2 || secondPage.NextCursor != nil {
		t.Fatalf("second discovery page was unexpected: count=%d cursor=%v", len(secondPage.Strategies), secondPage.NextCursor)
	}

	for name, path := range map[string]string{
		"map":        fmt.Sprintf("/public/strategies?mapId=%d", fixture.mapID),
		"mode":       fmt.Sprintf("/public/strategies?modeId=%d", fixture.modeID),
		"hero":       fmt.Sprintf("/public/strategies?heroId=%d", fixture.heroID),
		"execution":  "/public/strategies?executionDifficulty=5",
		"difficulty": "/public/strategies?mapDifficulty=Beginner",
		"version":    "/public/strategies?version=99.2",
	} {
		t.Run("filter_"+name, func(t *testing.T) {
			page := publicResponse[chimpsapi.PublicStrategyPage](t, handler, path, http.StatusOK)
			if len(page.Strategies) == 0 {
				t.Fatalf("filter %s returned no fixture strategies", path)
			}
		})
	}
	publicResponse[chimpsapi.ErrorResponse](t, handler, "/public/strategies?executionDifficulty=6", http.StatusBadRequest)
	publicResponse[chimpsapi.ErrorResponse](t, handler, "/public/strategies?mapDifficulty=Impossible", http.StatusBadRequest)

	strategy := publicResponse[chimpsapi.PublicStrategyDetail](t, handler, fmt.Sprintf("/public/strategies/%d", fixture.detailID), http.StatusOK)
	if len(strategy.Placements) != 2 || len(strategy.Steps) != 1 || strategy.Hero == nil {
		t.Fatalf("strategy detail lost placements, steps, or hero: %+v", strategy)
	}
	nullable := publicResponse[chimpsapi.PublicStrategyDetail](t, handler, fmt.Sprintf("/public/strategies/%d", fixture.nullableID), http.StatusOK)
	if nullable.Map.Difficulty != nil || nullable.Hero != nil || nullable.ExecutionDifficulty != nil || nullable.Description != nil {
		t.Fatalf("nullable public fields changed shape: %+v", nullable)
	}
	publicResponse[chimpsapi.ErrorResponse](t, handler, fmt.Sprintf("/public/strategies/%d", fixture.draftID), http.StatusNotFound)

	home := publicResponse[struct {
		Maps []chimpsapi.HomeMap `json:"maps"`
	}](t, handler, "/public/maps", http.StatusOK)
	homeMap, found := findByID(home.Maps, fixture.mapID, func(item chimpsapi.HomeMap) int64 { return item.Id })
	if !found || homeMap.GuideCount != 25 || slices.ContainsFunc(home.Maps, func(item chimpsapi.HomeMap) bool { return item.Id == fixture.nullMapID }) {
		t.Fatalf("home map counts or null-difficulty filtering changed: %+v", home.Maps)
	}

	heroes := publicResponse[struct {
		Heroes []chimpsapi.HeroSummary `json:"heroes"`
	}](t, handler, "/public/heroes", http.StatusOK)
	hero, found := findByID(heroes.Heroes, fixture.heroID, func(item chimpsapi.HeroSummary) int64 { return item.Id })
	if !found || hero.GuideCount != 25 {
		t.Fatalf("hero guide count changed: %+v", hero)
	}
	heroDetail := publicResponse[chimpsapi.PublicHeroDetail](t, handler, fmt.Sprintf("/public/heroes/%d", fixture.heroID), http.StatusOK)
	if heroDetail.GuideCount != 25 || len(heroDetail.Synergies) != 2 ||
		!slices.Equal(heroDetail.Versions, []string{"99.2", "99.1"}) || len(heroDetail.Maps) != 1 || len(heroDetail.Modes) != 1 {
		t.Fatalf("hero detail aggregates changed: %+v", heroDetail)
	}

	sitemap := publicResponse[chimpsapi.SitemapEntries](t, handler, "/public/sitemap", http.StatusOK)
	if len(sitemap.StrategyIds) != 26 || slices.Contains(sitemap.StrategyIds, fixture.draftID) || !slices.Contains(sitemap.HeroIds, fixture.heroID) {
		t.Fatalf("sitemap did not contain only ready strategy IDs and all hero IDs: %+v", sitemap)
	}

	if _, err := pool.Exec(ctx, "update public.towers set category = 'Support' where id = $1", fixture.heroID); err != nil {
		t.Fatalf("make ready rows inconsistent: %v", err)
	}
	inconsistent := publicResponse[chimpsapi.PublicStrategiesResponse](t, handler, "/public/latest?limit=24", http.StatusOK)
	if len(inconsistent.Strategies) != 1 || inconsistent.Strategies[0].Id != fixture.nullableID {
		t.Fatalf("inconsistent ready rows were not omitted independently: %+v", inconsistent.Strategies)
	}
	inconsistentPage := publicResponse[chimpsapi.PublicStrategyPage](t, handler, "/public/strategies", http.StatusOK)
	if len(inconsistentPage.Strategies) != 1 || inconsistentPage.Strategies[0].Id != fixture.nullableID || inconsistentPage.NextCursor == nil {
		t.Fatalf("inconsistent rows changed raw pagination boundaries: %+v", inconsistentPage)
	}
	publicResponse[chimpsapi.ErrorResponse](t, handler, fmt.Sprintf("/public/strategies/%d", fixture.detailID), http.StatusNotFound)
	if _, err := pool.Exec(ctx, "update public.towers set category = 'Hero' where id = $1", fixture.heroID); err != nil {
		t.Fatalf("restore fixture hero: %v", err)
	}
}

type publicFixture struct {
	mapID, nullMapID, modeID, heroID int64
	detailID, nullableID, draftID    int64
}

func seedPublicFixtures(t *testing.T, ctx context.Context, pool *pgxpool.Pool) publicFixture {
	t.Helper()
	var fixture publicFixture
	if err := pool.QueryRow(ctx, `insert into public.maps (name, difficulty, nk_map_id, nk_image_url) values ('Codex Public Map', 'Beginner', 'codex-public-map', 'https://example.com/map.webp') returning id`).Scan(&fixture.mapID); err != nil {
		t.Fatalf("create public map: %v", err)
	}
	if err := pool.QueryRow(ctx, `insert into public.maps (name, difficulty, nk_map_id) values ('Codex Public Null Map', null, 'codex-public-null-map') returning id`).Scan(&fixture.nullMapID); err != nil {
		t.Fatalf("create nullable public map: %v", err)
	}
	fixture.modeID = requiredFixtureID(t, ctx, pool, "select id from public.game_modes where name = 'CHIMPS'")
	if err := pool.QueryRow(ctx, `insert into public.towers (name, category, icon_path, description, base_cost, attack_style, xp_ratio) values ('Codex Public Hero', 'Hero', 'codex-public-hero.webp', 'Fixture hero', 500, 'Sharp', 1.25) returning id`).Scan(&fixture.heroID); err != nil {
		t.Fatalf("create public hero: %v", err)
	}
	var towerID, laterTowerID int64
	if err := pool.QueryRow(ctx, `insert into public.towers (name, category, icon_path) values ('Codex Public Tower', 'Primary', 'codex-public-tower.webp') returning id`).Scan(&towerID); err != nil {
		t.Fatalf("create public tower: %v", err)
	}
	if err := pool.QueryRow(ctx, `insert into public.towers (name, category, icon_path) values ('Codex Public Later Tower', 'Support', 'codex-public-later-tower.webp') returning id`).Scan(&laterTowerID); err != nil {
		t.Fatalf("create later public tower: %v", err)
	}
	for _, towerID := range []int64{requiredFixtureID(t, ctx, pool, "select id from public.towers where id < "+fmt.Sprint(fixture.heroID)+" order by id limit 1"), laterTowerID} {
		if _, err := pool.Exec(ctx, `insert into public.tower_synergies (tower_a_id, tower_b_id, description) values (least($1::bigint, $2::bigint), greatest($1::bigint, $2::bigint), 'Public integration synergy')`, fixture.heroID, towerID); err != nil {
			t.Fatalf("create public synergy: %v", err)
		}
	}

	for index := range 25 {
		version := "99.1"
		if index%2 == 0 {
			version = "99.2"
		}
		var strategyID int64
		if err := pool.QueryRow(ctx, `
			insert into public.strategies (map_id, game_mode_id, title, hero_id, verified_version, exec_difficulty, status)
			values ($1, $2, $3, $4, $5, $6, 'ready') returning id
		`, fixture.mapID, fixture.modeID, fmt.Sprintf("Codex public ready %02d", index), fixture.heroID, version, index%5+1).Scan(&strategyID); err != nil {
			t.Fatalf("create ready public strategy: %v", err)
		}
		if index == 0 {
			fixture.detailID = strategyID
		}
	}
	if err := pool.QueryRow(ctx, `insert into public.strategies (map_id, game_mode_id, title, description, verified_version, status) values ($1, $2, 'Codex public nullable', null, '99.1', 'ready') returning id`, fixture.nullMapID, fixture.modeID).Scan(&fixture.nullableID); err != nil {
		t.Fatalf("create nullable public strategy: %v", err)
	}
	if err := pool.QueryRow(ctx, `insert into public.strategies (map_id, game_mode_id, title, hero_id, status) values ($1, $2, 'Codex public draft', $3, 'draft') returning id`, fixture.mapID, fixture.modeID, fixture.heroID).Scan(&fixture.draftID); err != nil {
		t.Fatalf("create draft public strategy: %v", err)
	}
	var placementID int64
	if err := pool.QueryRow(ctx, `insert into public.placements (strategy_id, tower_id, pos_x, pos_y, final_path, label) values ($1, $2, 0.25, 0.75, '2-0-5', 'Main') returning id`, fixture.detailID, towerID).Scan(&placementID); err != nil {
		t.Fatalf("create detail placement: %v", err)
	}
	if _, err := pool.Exec(ctx, `insert into public.placements (strategy_id, tower_id, pos_x, pos_y) values ($1, $2, 0.5, 0.5)`, fixture.detailID, fixture.heroID); err != nil {
		t.Fatalf("create detail hero placement: %v", err)
	}
	if _, err := pool.Exec(ctx, `insert into public.steps (strategy_id, placement_id, round_number, action, target_path, description, order_index) values ($1, $2, 10, 'upgrade', '2-0-5', 'Upgrade it', 1)`, fixture.detailID, placementID); err != nil {
		t.Fatalf("create detail step: %v", err)
	}
	return fixture
}

func cleanupPublicFixtures(t *testing.T, ctx context.Context, pool *pgxpool.Pool) {
	t.Helper()
	if _, err := pool.Exec(ctx, "delete from public.strategies where title like 'Codex public %'"); err != nil {
		t.Fatalf("cleanup public strategies: %v", err)
	}
	if _, err := pool.Exec(ctx, "delete from public.towers where name like 'Codex Public %'"); err != nil {
		t.Fatalf("cleanup public towers: %v", err)
	}
	if _, err := pool.Exec(ctx, "delete from public.maps where nk_map_id like 'codex-public-%'"); err != nil {
		t.Fatalf("cleanup public maps: %v", err)
	}
}

func publicResponse[T any](t *testing.T, handler http.Handler, path string, status int) T {
	t.Helper()
	response := studioRequest(t, handler, http.MethodGet, path, nil, status)
	var decoded T
	decodeResponse(t, response, &decoded)
	return decoded
}

func findByID[T any](items []T, id int64, getID func(T) int64) (T, bool) {
	for _, item := range items {
		if getID(item) == id {
			return item, true
		}
	}
	var zero T
	return zero, false
}
