package chimps

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/go/generated/api"
	"github.com/GGomeSC/chimps.gg/go/generated/db"
	"github.com/jackc/pgx/v5"
)

const (
	publicPageSize     = 24
	publicQueryTimeout = 5 * time.Second
)

type publicMapRecord struct {
	ID         int64   `json:"id"`
	Name       string  `json:"name"`
	Difficulty *string `json:"difficulty"`
	ImageURL   *string `json:"image_url"`
	NKImageURL *string `json:"nk_image_url"`
}

type publicModeRecord struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type publicTowerRecord struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category,omitempty"`
	IconPath string `json:"icon_path"`
}

type publicPlacementRecord struct {
	ID        int64              `json:"id"`
	TowerID   int64              `json:"tower_id"`
	PosX      float64            `json:"pos_x"`
	PosY      float64            `json:"pos_y"`
	FinalPath *string            `json:"final_path,omitempty"`
	Label     *string            `json:"label,omitempty"`
	Tower     *publicTowerRecord `json:"tower,omitempty"`
}

type publicStepRecord struct {
	ID          int64   `json:"id"`
	PlacementID *int64  `json:"placement_id"`
	RoundNumber int     `json:"round_number"`
	Action      string  `json:"action"`
	TargetPath  *string `json:"target_path"`
	Description *string `json:"description"`
	OrderIndex  int     `json:"order_index"`
}

type publicStrategyRecord struct {
	ID              int64                   `json:"id"`
	Title           string                  `json:"title"`
	Description     *string                 `json:"description"`
	HeroID          *int64                  `json:"hero_id"`
	VerifiedVersion *string                 `json:"verified_version"`
	ExecDifficulty  *int                    `json:"exec_difficulty"`
	SourceURL       *string                 `json:"source_url,omitempty"`
	Map             *publicMapRecord        `json:"map"`
	Mode            *publicModeRecord       `json:"mode"`
	Hero            *publicTowerRecord      `json:"hero,omitempty"`
	Placements      []publicPlacementRecord `json:"placements"`
	Steps           []publicStepRecord      `json:"steps,omitempty"`
}

type publicReferenceRecord struct {
	Maps        []publicMapRecord   `json:"maps"`
	Modes       []publicModeRecord  `json:"modes"`
	Heroes      []publicTowerRecord `json:"heroes"`
	StrategyIDs []int64             `json:"strategyIds"`
}

type publicHeroSynergyRecord struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type publicHeroDetailRecord struct {
	ID                   int64                     `json:"id"`
	Name                 string                    `json:"name"`
	IconPath             string                    `json:"icon_path"`
	Description          *string                   `json:"description"`
	BaseCost             *int                      `json:"base_cost"`
	AttackStyle          *string                   `json:"attack_style"`
	XPRatio              *float64                  `json:"xp_ratio"`
	TechnicalDescription *string                   `json:"technical_description"`
	ProfileSourceURL     *string                   `json:"profile_source_url"`
	Synergies            []publicHeroSynergyRecord `json:"synergies"`
	Strategies           []publicStrategyRecord    `json:"strategies"`
}

func (s *server) GetPublicReferences(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	payload, err := queries.GetPublicReferences(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_public_references", err)
		return
	}
	var record publicReferenceRecord
	if err := json.Unmarshal(payload, &record); err != nil {
		s.databaseFailure(w, "decode_public_references", err)
		return
	}
	response := chimpsapi.PublicReferences{
		Maps:        make([]chimpsapi.PublicMap, 0, len(record.Maps)),
		Modes:       make([]chimpsapi.PublicMode, 0, len(record.Modes)),
		Heroes:      make([]chimpsapi.PublicHeroReference, 0, len(record.Heroes)),
		StrategyIds: record.StrategyIDs,
	}
	for _, item := range record.Maps {
		response.Maps = append(response.Maps, publicMap(item))
	}
	for _, item := range record.Modes {
		response.Modes = append(response.Modes, chimpsapi.PublicMode{Id: item.ID, Name: item.Name})
	}
	for _, item := range record.Heroes {
		response.Heroes = append(response.Heroes, publicHeroReference(item))
	}
	writeJSON(w, http.StatusOK, response)
}

func (s *server) GetPublicVersions(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	rows, err := queries.ListPublicVersions(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_public_versions", err)
		return
	}
	versions := make([]string, 0, len(rows))
	for _, version := range rows {
		if version != nil && *version != "" {
			versions = append(versions, *version)
		}
	}
	sortVersionsDescending(versions)
	writeJSON(w, http.StatusOK, map[string]any{"versions": versions})
}

func (s *server) GetPublicLatestStrategies(w http.ResponseWriter, r *http.Request, params chimpsapi.GetPublicLatestStrategiesParams) {
	limit := params.Limit
	if limit < 1 || limit > publicPageSize {
		writeError(w, http.StatusBadRequest, "invalid_limit", "Invalid limit.")
		return
	}
	page, err := s.listPublicStrategies(w, r, db.ListPublicStrategySummariesParams{PageLimit: int32(limit)}, limit)
	if err != nil {
		return
	}
	writeJSON(w, http.StatusOK, chimpsapi.PublicStrategiesResponse{Strategies: page.strategies})
}

func (s *server) GetPublicHomeMaps(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	rows, err := queries.ListPublicHomeMaps(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_public_home_maps", err)
		return
	}
	maps := make([]chimpsapi.HomeMap, 0, len(rows))
	for _, row := range rows {
		maps = append(maps, chimpsapi.HomeMap{
			Id: row.ID, Name: row.Name, Difficulty: mapDifficulty(row.Difficulty),
			ImageUrl: preferredImage(row.ImageUrl, row.NkImageUrl), GuideCount: int(row.GuideCount),
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"maps": maps})
}

func (s *server) DiscoverPublicStrategies(w http.ResponseWriter, r *http.Request, params chimpsapi.DiscoverPublicStrategiesParams) {
	if invalidPositiveID(params.MapId) || invalidPositiveID(params.ModeId) || invalidPositiveID(params.HeroId) ||
		invalidPositiveID(params.Cursor) ||
		(params.ExecutionDifficulty != nil && (*params.ExecutionDifficulty < 1 || *params.ExecutionDifficulty > 5)) ||
		(params.MapDifficulty != nil && !validMapDifficulty(*params.MapDifficulty)) {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request.")
		return
	}
	query := db.ListPublicStrategySummariesParams{
		MapID: params.MapId, ModeID: params.ModeId, HeroID: params.HeroId,
		ExecDifficulty: intPointer16(params.ExecutionDifficulty),
		Cursor:         params.Cursor, PageLimit: publicPageSize + 1,
	}
	if params.MapDifficulty != nil {
		value := string(*params.MapDifficulty)
		query.MapDifficulty = &value
	}
	query.VerifiedVersion = params.Version
	page, err := s.listPublicStrategies(w, r, query, publicPageSize)
	if err != nil {
		return
	}
	if page.rawCount <= publicPageSize {
		page.cursorID = nil
	}
	writeJSON(w, http.StatusOK, chimpsapi.PublicStrategyPage{Strategies: page.strategies, NextCursor: page.cursorID})
}

func invalidPositiveID(value *int64) bool {
	return value != nil && *value < 1
}

func validMapDifficulty(value chimpsapi.MapDifficulty) bool {
	switch value {
	case chimpsapi.Beginner, chimpsapi.Intermediate, chimpsapi.Advanced, chimpsapi.Expert:
		return true
	default:
		return false
	}
}

func (s *server) GetPublicStrategy(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	payload, err := queries.GetPublicStrategyDetail(ctx, strategyID)
	s.countQueries(r, 1)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "strategy_not_found", "Strategy not found")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_public_strategy", err)
		return
	}
	var record publicStrategyRecord
	if err := json.Unmarshal(payload, &record); err != nil {
		s.databaseFailure(w, "decode_public_strategy", err)
		return
	}
	summary, ok := publicStrategySummary(record, nil)
	if !ok {
		writeError(w, http.StatusNotFound, "strategy_not_found", "Strategy not found")
		return
	}

	placements := make([]chimpsapi.StrategyMapPlacement, 0, len(record.Placements))
	towersByID := make(map[int64]chimpsapi.StrategyMapTower)
	for _, placement := range record.Placements {
		placements = append(placements, chimpsapi.StrategyMapPlacement{
			Id: placement.ID, TowerId: placement.TowerID, X: placement.PosX, Y: placement.PosY,
			FinalPath: placement.FinalPath, Label: placement.Label,
		})
		if placement.Tower != nil {
			towersByID[placement.Tower.ID] = chimpsapi.StrategyMapTower{
				Id: placement.Tower.ID, Name: placement.Tower.Name,
				Category: chimpsapi.TowerCategory(placement.Tower.Category),
				IconUrl:  towerIconURL(placement.Tower.IconPath),
			}
		}
	}
	towers := make([]chimpsapi.StrategyMapTower, 0, len(towersByID))
	for _, tower := range towersByID {
		towers = append(towers, tower)
	}
	sort.Slice(towers, func(i, j int) bool { return towers[i].Name < towers[j].Name })
	steps := make([]chimpsapi.PublicStep, 0, len(record.Steps))
	for _, step := range record.Steps {
		steps = append(steps, chimpsapi.PublicStep{
			Id: step.ID, PlacementId: step.PlacementID, RoundNumber: step.RoundNumber,
			Action: chimpsapi.StepAction(step.Action), TargetPath: step.TargetPath, Description: step.Description,
		})
	}
	writeJSON(w, http.StatusOK, chimpsapi.PublicStrategyDetail{
		Id: summary.Id, Title: summary.Title, Description: summary.Description,
		Map: summary.Map, Mode: summary.Mode, Hero: summary.Hero,
		VerifiedVersion: summary.VerifiedVersion, ExecutionDifficulty: summary.ExecutionDifficulty,
		PlacementDots: summary.PlacementDots, SourceUrl: record.SourceURL,
		Placements: placements, Towers: towers, Steps: steps,
	})
}

func (s *server) GetPublicHeroes(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	rows, err := queries.ListPublicHeroes(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_public_heroes", err)
		return
	}
	heroes := make([]chimpsapi.HeroSummary, 0, len(rows))
	for _, row := range rows {
		heroes = append(heroes, chimpsapi.HeroSummary{
			Id: row.ID, Name: row.Name, IconUrl: towerIconURL(row.IconPath), GuideCount: int(row.GuideCount),
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"heroes": heroes})
}

func (s *server) GetPublicHero(w http.ResponseWriter, r *http.Request, heroID chimpsapi.HeroId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	payload, err := queries.GetPublicHeroDetail(ctx, heroID)
	s.countQueries(r, 1)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "hero_not_found", "Hero not found")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_public_hero", err)
		return
	}
	var record publicHeroDetailRecord
	if err := json.Unmarshal(payload, &record); err != nil {
		s.databaseFailure(w, "decode_public_hero", err)
		return
	}
	heroReference := publicTowerRecord{ID: record.ID, Name: record.Name, IconPath: record.IconPath}
	strategies := make([]chimpsapi.PublicStrategySummary, 0, len(record.Strategies))
	for _, item := range record.Strategies {
		if summary, valid := publicStrategySummary(item, &heroReference); valid {
			strategies = append(strategies, summary)
		}
	}
	maps := uniquePublicMaps(strategies)
	modes := uniquePublicModes(strategies)
	versionsSet := make(map[string]struct{})
	for _, strategy := range strategies {
		versionsSet[strategy.VerifiedVersion] = struct{}{}
	}
	versions := make([]string, 0, len(versionsSet))
	for version := range versionsSet {
		versions = append(versions, version)
	}
	sortVersionsDescending(versions)
	synergies := make([]struct {
		Description *string `json:"description"`
		Id          int64   `json:"id"`
		Name        string  `json:"name"`
	}, 0, len(record.Synergies))
	for _, synergy := range record.Synergies {
		synergies = append(synergies, struct {
			Description *string `json:"description"`
			Id          int64   `json:"id"`
			Name        string  `json:"name"`
		}{synergy.Description, synergy.ID, synergy.Name})
	}
	writeJSON(w, http.StatusOK, chimpsapi.PublicHeroDetail{
		Id: record.ID, Name: record.Name, IconUrl: towerIconURL(record.IconPath),
		GuideCount: len(strategies), Description: record.Description, BaseCost: record.BaseCost,
		AttackStyle: record.AttackStyle, XpRatio: record.XPRatio,
		TechnicalDescription: record.TechnicalDescription, ProfileSourceUrl: record.ProfileSourceURL,
		Synergies: synergies, Strategies: strategies, Maps: maps, Modes: modes, Versions: versions,
	})
}

func (s *server) GetPublicSitemapEntries(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	payload, err := queries.GetPublicSitemapEntries(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_public_sitemap", err)
		return
	}
	var entries chimpsapi.SitemapEntries
	if err := json.Unmarshal(payload, &entries); err != nil {
		s.databaseFailure(w, "decode_public_sitemap", err)
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

type publicStrategyList struct {
	strategies []chimpsapi.PublicStrategySummary
	rawCount   int
	cursorID   *int64
}

func (s *server) listPublicStrategies(w http.ResponseWriter, r *http.Request, params db.ListPublicStrategySummariesParams, visibleLimit int) (publicStrategyList, error) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return publicStrategyList{}, errors.New("database unavailable")
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), publicQueryTimeout)
	defer cancel()
	rows, err := queries.ListPublicStrategySummaries(ctx, params)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "list_public_strategies", err)
		return publicStrategyList{}, err
	}
	result := publicStrategyList{
		strategies: make([]chimpsapi.PublicStrategySummary, 0, min(len(rows), visibleLimit)),
		rawCount:   len(rows),
	}
	for index, row := range rows {
		if index == visibleLimit-1 {
			cursorID := row.ID
			result.cursorID = &cursorID
		}
		if index >= visibleLimit {
			continue
		}
		var placements []publicPlacementRecord
		if err := json.Unmarshal(row.Placements, &placements); err != nil {
			s.logger.Error("skipping malformed public strategy placements", "strategy_id", row.ID)
			continue
		}
		record := publicStrategyRecord{
			ID: row.ID, Title: row.Title, Description: row.Description, HeroID: row.HeroID,
			VerifiedVersion: row.VerifiedVersion, ExecDifficulty: int16Pointer(row.ExecDifficulty),
			Map:  &publicMapRecord{ID: row.MapID, Name: row.MapName, Difficulty: row.MapDifficulty, ImageURL: row.MapImageUrl, NKImageURL: row.MapNkImageUrl},
			Mode: &publicModeRecord{ID: row.ModeID, Name: row.ModeName}, Placements: placements,
		}
		if row.HeroReferenceID != nil && row.HeroName != nil && row.HeroIconPath != nil {
			record.Hero = &publicTowerRecord{ID: *row.HeroReferenceID, Name: *row.HeroName, IconPath: *row.HeroIconPath}
		}
		if summary, valid := publicStrategySummary(record, nil); valid {
			result.strategies = append(result.strategies, summary)
		} else {
			s.logger.Error("skipping incomplete ready strategy", "strategy_id", row.ID)
		}
	}
	return result, nil
}

func publicStrategySummary(record publicStrategyRecord, heroOverride *publicTowerRecord) (chimpsapi.PublicStrategySummary, bool) {
	hero := record.Hero
	if heroOverride != nil {
		hero = heroOverride
	}
	if record.Map == nil || record.Mode == nil || record.VerifiedVersion == nil || *record.VerifiedVersion == "" {
		return chimpsapi.PublicStrategySummary{}, false
	}
	if record.HeroID != nil && hero == nil {
		return chimpsapi.PublicStrategySummary{}, false
	}
	var heroResponse *chimpsapi.PublicHeroReference
	if hero != nil {
		converted := publicHeroReference(*hero)
		heroResponse = &converted
	}
	dots := make([]chimpsapi.PlacementDot, 0, len(record.Placements))
	for _, placement := range record.Placements {
		dots = append(dots, chimpsapi.PlacementDot{
			Id: placement.ID, X: placement.PosX, Y: placement.PosY,
			IsHero: record.HeroID != nil && placement.TowerID == *record.HeroID,
		})
	}
	return chimpsapi.PublicStrategySummary{
		Id: record.ID, Title: record.Title, Description: record.Description,
		Map: publicMap(*record.Map), Mode: chimpsapi.PublicMode{Id: record.Mode.ID, Name: record.Mode.Name},
		Hero: heroResponse, VerifiedVersion: *record.VerifiedVersion,
		ExecutionDifficulty: record.ExecDifficulty, PlacementDots: dots,
	}, true
}

func publicMap(record publicMapRecord) chimpsapi.PublicMap {
	return chimpsapi.PublicMap{
		Id: record.ID, Name: record.Name, Difficulty: mapDifficulty(record.Difficulty),
		ImageUrl: preferredImage(record.ImageURL, record.NKImageURL),
	}
}

func publicHeroReference(record publicTowerRecord) chimpsapi.PublicHeroReference {
	return chimpsapi.PublicHeroReference{Id: record.ID, Name: record.Name, IconUrl: towerIconURL(record.IconPath)}
}

func preferredImage(primary *string, fallback *string) *string {
	if primary != nil {
		return primary
	}
	return fallback
}

func uniquePublicMaps(strategies []chimpsapi.PublicStrategySummary) []chimpsapi.PublicMap {
	seen := make(map[int64]struct{})
	result := make([]chimpsapi.PublicMap, 0)
	for _, strategy := range strategies {
		if _, exists := seen[strategy.Map.Id]; exists {
			continue
		}
		seen[strategy.Map.Id] = struct{}{}
		result = append(result, strategy.Map)
	}
	return result
}

func uniquePublicModes(strategies []chimpsapi.PublicStrategySummary) []chimpsapi.PublicMode {
	seen := make(map[int64]struct{})
	result := make([]chimpsapi.PublicMode, 0)
	for _, strategy := range strategies {
		if _, exists := seen[strategy.Mode.Id]; exists {
			continue
		}
		seen[strategy.Mode.Id] = struct{}{}
		result = append(result, strategy.Mode)
	}
	return result
}

func sortVersionsDescending(versions []string) {
	sort.Slice(versions, func(i, j int) bool {
		left := versionNumbers(versions[i])
		right := versionNumbers(versions[j])
		for index := 0; index < len(left) || index < len(right); index++ {
			var leftValue, rightValue int
			if index < len(left) {
				leftValue = left[index]
			}
			if index < len(right) {
				rightValue = right[index]
			}
			if leftValue != rightValue {
				return leftValue > rightValue
			}
		}
		return versions[i] > versions[j]
	})
}

func versionNumbers(value string) []int {
	parts := strings.FieldsFunc(value, func(r rune) bool { return r < '0' || r > '9' })
	numbers := make([]int, 0, len(parts))
	for _, part := range parts {
		if number, err := strconv.Atoi(part); err == nil {
			numbers = append(numbers, number)
		}
	}
	return numbers
}
