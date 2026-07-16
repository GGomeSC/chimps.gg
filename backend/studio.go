package chimps

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/backend/generated/api"
	"github.com/GGomeSC/chimps.gg/backend/generated/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

const studioQueryTimeout = 5 * time.Second

type optionalJSON[T any] struct {
	Set   bool
	Value *T
}

func (o *optionalJSON[T]) UnmarshalJSON(data []byte) error {
	o.Set = true
	if bytes.Equal(data, []byte("null")) {
		o.Value = nil
		return nil
	}

	var value T
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	o.Value = &value
	return nil
}

type placementPatch struct {
	FinalPath optionalJSON[string]  `json:"final_path"`
	Label     optionalJSON[string]  `json:"label"`
	Notes     optionalJSON[string]  `json:"notes"`
	PosX      optionalJSON[float64] `json:"pos_x"`
	PosY      optionalJSON[float64] `json:"pos_y"`
}

func (s *server) GetStudioMaps(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	maps, err := queries.ListStudioMaps(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_studio_maps", err)
		return
	}

	response := make([]chimpsapi.MapRow, 0, len(maps))
	for _, item := range maps {
		response = append(response, mapRow(item))
	}
	writeJSON(w, http.StatusOK, map[string]any{"maps": response})
}

func (s *server) GetStudioStrategyReferences(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	maps, err := queries.ListStudioReferenceMaps(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_strategy_reference_maps", err)
		return
	}
	modes, err := queries.ListGameModes(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_strategy_modes", err)
		return
	}
	heroes, err := queries.ListStudioHeroReferences(ctx)
	s.countQueries(r, 3)
	if err != nil {
		s.databaseFailure(w, "get_studio_strategy_heroes", err)
		return
	}

	response := chimpsapi.StudioStrategyReferences{
		Maps:   make([]chimpsapi.MapReference, 0, len(maps)),
		Modes:  make([]chimpsapi.GameModeRow, 0, len(modes)),
		Heroes: make([]chimpsapi.TowerReference, 0, len(heroes)),
	}
	for _, item := range maps {
		response.Maps = append(response.Maps, chimpsapi.MapReference{Id: item.ID, Name: item.Name, Difficulty: mapDifficulty(item.Difficulty)})
	}
	for _, item := range modes {
		response.Modes = append(response.Modes, chimpsapi.GameModeRow{Id: item.ID, Name: item.Name})
	}
	for _, item := range heroes {
		response.Heroes = append(response.Heroes, chimpsapi.TowerReference{Id: item.ID, Name: item.Name})
	}
	writeJSON(w, http.StatusOK, response)
}

func (s *server) GetStudioStrategies(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	rows, err := queries.ListStudioStrategies(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_studio_strategies", err)
		return
	}

	strategies := make([]chimpsapi.StudioStrategyListItem, 0, len(rows))
	for _, row := range rows {
		strategies = append(strategies, chimpsapi.StudioStrategyListItem{
			Id: row.ID, MapId: row.MapID, GameModeId: row.GameModeID, Title: row.Title,
			Description: row.Description, HeroId: row.HeroID, SourceUrl: row.SourceUrl,
			VerifiedVersion: row.VerifiedVersion, ExecDifficulty: int16Pointer(row.ExecDifficulty),
			Status: chimpsapi.StrategyStatus(row.Status), Score: int32Pointer(row.Score),
			CreatedAt: row.CreatedAt.Time, UpdatedAt: row.UpdatedAt.Time,
			MapName: row.MapName, ModeName: row.ModeName, HeroName: row.HeroName,
			PlacementCount: int(row.PlacementCount),
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"strategies": strategies})
}

func (s *server) GetStudioStrategy(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	strategy, err := queries.GetStudioStrategy(ctx, strategyID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "strategy_not_found", "Strategy not found")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_studio_strategy", err)
		return
	}
	maps, err := queries.ListStudioEditorMaps(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_editor_maps", err)
		return
	}
	modes, err := queries.ListGameModes(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_editor_modes", err)
		return
	}
	towers, err := queries.ListStudioTowers(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_editor_towers", err)
		return
	}
	placements, err := queries.ListStrategyPlacements(ctx, strategyID)
	if err != nil {
		s.databaseFailure(w, "get_studio_editor_placements", err)
		return
	}
	steps, err := queries.ListStrategySteps(ctx, strategyID)
	s.countQueries(r, 6)
	if err != nil {
		s.databaseFailure(w, "get_studio_editor_steps", err)
		return
	}

	responseMaps := make([]struct {
		Difficulty *chimpsapi.MapDifficulty `json:"difficulty"`
		Id         int64                    `json:"id"`
		ImageUrl   *string                  `json:"image_url"`
		Name       string                   `json:"name"`
		NkImageUrl *string                  `json:"nk_image_url"`
	}, 0, len(maps))
	for _, item := range maps {
		responseMaps = append(responseMaps, struct {
			Difficulty *chimpsapi.MapDifficulty `json:"difficulty"`
			Id         int64                    `json:"id"`
			ImageUrl   *string                  `json:"image_url"`
			Name       string                   `json:"name"`
			NkImageUrl *string                  `json:"nk_image_url"`
		}{mapDifficulty(item.Difficulty), item.ID, item.ImageUrl, item.Name, item.NkImageUrl})
	}
	responseModes := make([]chimpsapi.GameModeRow, 0, len(modes))
	for _, item := range modes {
		responseModes = append(responseModes, chimpsapi.GameModeRow{Id: item.ID, Name: item.Name})
	}
	responseTowers := make([]chimpsapi.TowerRow, 0, len(towers))
	for _, item := range towers {
		responseTowers = append(responseTowers, towerRow(item))
	}
	responsePlacements := make([]chimpsapi.PlacementRow, 0, len(placements))
	for _, item := range placements {
		responsePlacements = append(responsePlacements, placementRow(item))
	}
	responseSteps := make([]chimpsapi.StepRow, 0, len(steps))
	for _, item := range steps {
		responseSteps = append(responseSteps, stepRow(item))
	}

	writeJSON(w, http.StatusOK, chimpsapi.StudioStrategyEditor{
		Strategy: strategyRow(strategy), Maps: responseMaps, Modes: responseModes,
		Towers: responseTowers, Placements: responsePlacements, Steps: responseSteps,
	})
}

func (s *server) CreateStudioStrategy(w http.ResponseWriter, r *http.Request) {
	var input chimpsapi.StrategyInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	if !s.validateStrategyHero(w, r, queries, input.HeroId) {
		return
	}
	id, err := queries.CreateStudioStrategy(ctx, createStrategyParams(input))
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "create_studio_strategy", err)
		return
	}
	writeJSON(w, http.StatusOK, chimpsapi.IdResponse{Id: id})
}

func (s *server) UpdateStudioStrategyMetadata(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	var input chimpsapi.StrategyInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()

	if !s.validateStrategyHero(w, r, queries, input.HeroId) {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	params := updateStrategyParams(input)
	params.StrategyID = strategyID
	if err := queries.UpdateStudioStrategy(ctx, params); err != nil {
		s.databaseFailure(w, "update_studio_strategy", err)
		return
	}
	s.countQueries(r, 1)
	writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
}

func (s *server) DeleteStudioStrategy(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	if err := queries.DeleteStudioStrategy(ctx, strategyID); err != nil {
		s.databaseFailure(w, "delete_studio_strategy", err)
		return
	}
	s.countQueries(r, 1)
	writeJSON(w, http.StatusOK, chimpsapi.SuccessResponse{Success: true})
}

func (s *server) CreateStudioStep(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	var input chimpsapi.StepInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	if !s.validateStepRelations(w, r, queries, strategyID, input) {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	orderIndex, err := queries.NextStrategyStepOrder(ctx, strategyID)
	if err != nil {
		s.databaseFailure(w, "next_studio_step_order", err)
		return
	}
	err = queries.CreateStudioStep(ctx, db.CreateStudioStepParams{
		StrategyID: strategyID, PlacementID: input.PlacementId, RoundNumber: int16(input.RoundNumber),
		Action: string(input.Action), TargetPath: input.TargetPath, Description: input.Description,
		OrderIndex: orderIndex,
	})
	s.countQueries(r, 2)
	if err != nil {
		s.databaseFailure(w, "create_studio_step", err)
		return
	}
	writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
}

func (s *server) UpdateStudioStep(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId, stepID chimpsapi.StepId) {
	var input chimpsapi.StepInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	if !s.validateStepRelations(w, r, queries, strategyID, input) {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	err := queries.UpdateStudioStep(ctx, db.UpdateStudioStepParams{
		StrategyID: strategyID, StepID: stepID, PlacementID: input.PlacementId,
		RoundNumber: int16(input.RoundNumber), Action: string(input.Action),
		TargetPath: input.TargetPath, Description: input.Description,
	})
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "update_studio_step", err)
		return
	}
	writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
}

func (s *server) DeleteStudioStep(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId, stepID chimpsapi.StepId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	if err := queries.DeleteStudioStep(ctx, db.DeleteStudioStepParams{StrategyID: strategyID, StepID: stepID}); err != nil {
		s.databaseFailure(w, "delete_studio_step", err)
		return
	}
	s.countQueries(r, 1)
	writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
}

func (s *server) MoveStudioStep(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId, stepID chimpsapi.StepId) {
	var input chimpsapi.MoveStudioStepJSONRequestBody
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.Direction != chimpsapi.Up && input.Direction != chimpsapi.Down {
		writeError(w, http.StatusBadRequest, "invalid_move", "Invalid move")
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	ids, err := queries.ListStrategyStepIds(ctx, strategyID)
	if err != nil {
		s.databaseFailure(w, "list_studio_step_ids", err)
		return
	}
	from := indexOf(ids, stepID)
	to := from + 1
	if input.Direction == chimpsapi.Up {
		to = from - 1
	}
	if from == -1 || to < 0 || to >= len(ids) {
		s.countQueries(r, 1)
		writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
		return
	}
	ids[from], ids[to] = ids[to], ids[from]
	if err := queries.ReorderStudioSteps(ctx, db.ReorderStudioStepsParams{StrategyID: strategyID, StepIds: ids}); err != nil {
		s.databaseFailure(w, "reorder_studio_steps", err)
		return
	}
	s.countQueries(r, 2)
	writeJSON(w, http.StatusOK, chimpsapi.SavedResponse{Saved: true})
}

func (s *server) CreateStudioPlacement(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId) {
	var input chimpsapi.PlacementCreateInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	if !s.validateHeroPlacement(w, r, queries, strategyID, input.TowerId, nil) {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	placement, err := queries.CreateStudioPlacement(ctx, db.CreateStudioPlacementParams{
		StrategyID: strategyID, TowerID: input.TowerId, PosX: input.PosX, PosY: input.PosY,
	})
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "create_studio_placement", err)
		return
	}
	writeJSON(w, http.StatusCreated, placementRow(placement))
}

func (s *server) UpdateStudioPlacement(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId, placementID chimpsapi.PlacementId) {
	var patch placementPatch
	if !decodeJSON(w, r, &patch) {
		return
	}
	if !patch.FinalPath.Set && !patch.Label.Set && !patch.Notes.Set && !patch.PosX.Set && !patch.PosY.Set {
		writeError(w, http.StatusBadRequest, "nothing_to_update", "Nothing to update.")
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	current, err := queries.GetStudioPlacement(ctx, db.GetStudioPlacementParams{StrategyID: strategyID, PlacementID: placementID})
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "placement_not_found", "Placement not found")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_studio_placement", err)
		return
	}

	params := db.UpdateStudioPlacementParams{
		PlacementID: placementID, PosX: current.PosX, PosY: current.PosY,
		FinalPath: current.FinalPath, Label: current.Label, Notes: current.Notes,
	}
	if patch.PosX.Set {
		if patch.PosX.Value == nil {
			writeError(w, http.StatusBadRequest, "invalid_position", "Invalid position.")
			return
		}
		params.PosX = *patch.PosX.Value
	}
	if patch.PosY.Set {
		if patch.PosY.Value == nil {
			writeError(w, http.StatusBadRequest, "invalid_position", "Invalid position.")
			return
		}
		params.PosY = *patch.PosY.Value
	}
	if patch.FinalPath.Set {
		if patch.FinalPath.Value != nil {
			category, categoryErr := queries.GetTowerCategory(ctx, current.TowerID)
			if categoryErr != nil {
				s.databaseFailure(w, "get_studio_placement_tower", categoryErr)
				return
			}
			s.countQueries(r, 1)
			if category == "Hero" {
				writeError(w, http.StatusBadRequest, "hero_crosspath", "Heroes have no crosspath; final_path must stay empty")
				return
			}
		}
		params.FinalPath = patch.FinalPath.Value
	}
	if patch.Label.Set {
		params.Label = patch.Label.Value
	}
	if patch.Notes.Set {
		params.Notes = patch.Notes.Value
	}
	updated, err := queries.UpdateStudioPlacement(ctx, params)
	s.countQueries(r, 2)
	if err != nil {
		s.databaseFailure(w, "update_studio_placement", err)
		return
	}
	writeJSON(w, http.StatusOK, placementRow(updated))
}

func (s *server) DeleteStudioPlacement(w http.ResponseWriter, r *http.Request, strategyID chimpsapi.StrategyId, placementID chimpsapi.PlacementId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	if _, err := queries.GetStudioPlacement(ctx, db.GetStudioPlacementParams{StrategyID: strategyID, PlacementID: placementID}); errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "placement_not_found", "Placement not found")
		return
	} else if err != nil {
		s.databaseFailure(w, "get_studio_placement", err)
		return
	}
	if err := queries.DeleteStudioPlacement(ctx, placementID); err != nil {
		s.databaseFailure(w, "delete_studio_placement", err)
		return
	}
	s.countQueries(r, 2)
	w.WriteHeader(http.StatusNoContent)
}

func (s *server) GetStudioHeroes(w http.ResponseWriter, r *http.Request) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	rows, err := queries.ListStudioHeroes(ctx)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "get_studio_heroes", err)
		return
	}
	heroes := make([]chimpsapi.StudioHeroListItem, 0, len(rows))
	for _, row := range rows {
		heroes = append(heroes, chimpsapi.StudioHeroListItem{
			Id: row.ID, Name: row.Name, IconUrl: towerIconURL(row.IconPath),
			CompletedFields: int(row.CompletedFields), TotalFields: 6, SynergyCount: int(row.SynergyCount),
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"heroes": heroes})
}

func (s *server) GetStudioHero(w http.ResponseWriter, r *http.Request, heroID chimpsapi.HeroId) {
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	hero, err := queries.GetStudioHero(ctx, heroID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "hero_not_found", "Hero not found")
		return
	}
	if err != nil {
		s.databaseFailure(w, "get_studio_hero", err)
		return
	}
	towers, err := queries.ListStudioNonHeroTowers(ctx)
	if err != nil {
		s.databaseFailure(w, "get_studio_non_hero_towers", err)
		return
	}
	synergies, err := queries.ListStudioHeroSynergies(ctx, heroID)
	s.countQueries(r, 3)
	if err != nil {
		s.databaseFailure(w, "get_studio_hero_synergies", err)
		return
	}

	responseSynergies := make([]chimpsapi.StudioHeroSynergy, 0, len(synergies))
	for _, synergy := range synergies {
		responseSynergies = append(responseSynergies, chimpsapi.StudioHeroSynergy{TowerId: synergy.TowerID, Description: synergy.Description})
	}
	categoryOrder := []chimpsapi.TowerCategory{chimpsapi.Primary, chimpsapi.Military, chimpsapi.Magic, chimpsapi.Support}
	groups := make([]chimpsapi.TowerGroup, 0, len(categoryOrder))
	for _, category := range categoryOrder {
		group := chimpsapi.TowerGroup{Category: category, Towers: []struct {
			Category chimpsapi.TowerCategory `json:"category"`
			Id       int64                   `json:"id"`
			Name     string                  `json:"name"`
		}{}}
		for _, tower := range towers {
			if chimpsapi.TowerCategory(tower.Category) == category {
				group.Towers = append(group.Towers, struct {
					Category chimpsapi.TowerCategory `json:"category"`
					Id       int64                   `json:"id"`
					Name     string                  `json:"name"`
				}{chimpsapi.TowerCategory(tower.Category), tower.ID, tower.Name})
			}
		}
		groups = append(groups, group)
	}

	writeJSON(w, http.StatusOK, chimpsapi.StudioHeroEditor{
		Hero: chimpsapi.StudioHero{
			Id: hero.ID, Name: hero.Name, IconUrl: towerIconURL(hero.IconPath),
			Description: hero.Description, BaseCost: int32Pointer(hero.BaseCost), AttackStyle: hero.AttackStyle,
			XpRatio: numericPointer(hero.XpRatio), TechnicalDescription: hero.TechnicalDescription,
			ProfileSourceUrl: hero.ProfileSourceUrl, Synergies: responseSynergies,
		},
		TowerGroups: groups,
	})
}

func (s *server) UpdateStudioHeroProfile(w http.ResponseWriter, r *http.Request, heroID chimpsapi.HeroId) {
	var input chimpsapi.HeroProfileInput
	if !decodeJSON(w, r, &input) {
		return
	}
	queries, release, ok := s.acquireQueries(w, r)
	if !ok {
		return
	}
	defer release()
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	err := queries.UpdateStudioHeroProfile(ctx, db.UpdateStudioHeroProfileParams{
		HeroID: heroID, Description: input.Description, BaseCost: intPointer32(input.BaseCost),
		AttackStyle: input.AttackStyle, XpRatio: input.XpRatio,
		TechnicalDescription: input.TechnicalDescription, ProfileSourceUrl: input.ProfileSourceUrl,
		SynergyTowerIds: input.SynergyTowerIds, SynergyDescriptions: input.SynergyDescriptions,
	})
	s.countQueries(r, 1)
	if err != nil {
		message := "Invalid hero profile."
		var postgresError *pgconn.PgError
		if errors.As(err, &postgresError) && allowedHeroProfileError(postgresError.Message) {
			message = postgresError.Message
		}
		writeError(w, http.StatusBadRequest, "invalid_hero_profile", message)
		return
	}
	writeJSON(w, http.StatusOK, chimpsapi.SuccessResponse{Success: true})
}

func (s *server) validateStrategyHero(w http.ResponseWriter, r *http.Request, queries *db.Queries, heroID *int64) bool {
	if heroID == nil {
		return true
	}
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	category, err := queries.GetTowerCategory(ctx, *heroID)
	s.countQueries(r, 1)
	if err != nil || category != "Hero" {
		writeError(w, http.StatusBadRequest, "invalid_hero", "hero_id must be a Hero tower")
		return false
	}
	return true
}

func (s *server) validateStepRelations(w http.ResponseWriter, r *http.Request, queries *db.Queries, strategyID int64, input chimpsapi.StepInput) bool {
	if input.PlacementId == nil {
		return true
	}
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	towerID, err := queries.GetPlacementTowerForStrategy(ctx, db.GetPlacementTowerForStrategyParams{PlacementID: *input.PlacementId, StrategyID: strategyID})
	s.countQueries(r, 1)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusBadRequest, "placement_not_owned", "Placement does not belong to this strategy")
		return false
	}
	if err != nil {
		s.databaseFailure(w, "validate_studio_step_placement", err)
		return false
	}
	if input.TargetPath == nil {
		return true
	}
	category, err := queries.GetTowerCategory(ctx, towerID)
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "validate_studio_step_tower", err)
		return false
	}
	if category == "Hero" {
		writeError(w, http.StatusBadRequest, "hero_target_path", "Hero steps do not use target paths")
		return false
	}
	return true
}

func (s *server) validateHeroPlacement(w http.ResponseWriter, r *http.Request, queries *db.Queries, strategyID int64, towerID int64, excludedPlacementID *int64) bool {
	ctx, cancel := context.WithTimeout(r.Context(), studioQueryTimeout)
	defer cancel()
	category, err := queries.GetTowerCategory(ctx, towerID)
	s.countQueries(r, 1)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusBadRequest, "unknown_tower", "Unknown tower")
		return false
	}
	if err != nil {
		s.databaseFailure(w, "validate_studio_placement_tower", err)
		return false
	}
	if category != "Hero" {
		return true
	}
	exists, err := queries.StrategyHasHeroPlacement(ctx, db.StrategyHasHeroPlacementParams{StrategyID: strategyID, ExcludedPlacementID: excludedPlacementID})
	s.countQueries(r, 1)
	if err != nil {
		s.databaseFailure(w, "validate_studio_hero_placement", err)
		return false
	}
	if exists {
		writeError(w, http.StatusBadRequest, "hero_already_placed", "Strategy already has a hero placement")
		return false
	}
	return true
}

func (s *server) acquireQueries(w http.ResponseWriter, r *http.Request) (*db.Queries, func(), bool) {
	if s.postgres == nil || s.databaseErr != nil {
		writeError(w, http.StatusServiceUnavailable, "database_unavailable", "Database unavailable.")
		return nil, nil, false
	}
	ctx, cancel := context.WithTimeout(r.Context(), acquireTimeout)
	defer cancel()
	started := time.Now()
	connection, err := s.postgres.pool.Acquire(ctx)
	if metrics, ok := r.Context().Value(requestMetricsKey{}).(*requestMetrics); ok {
		metrics.acquireDuration = time.Since(started)
	}
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, "database_unavailable", "Database unavailable.")
		return nil, nil, false
	}
	return db.New(connection), connection.Release, true
}

func (s *server) countQueries(r *http.Request, count int) {
	if metrics, ok := r.Context().Value(requestMetricsKey{}).(*requestMetrics); ok {
		metrics.queryCount += count
	}
}

func (s *server) databaseFailure(w http.ResponseWriter, operation string, err error) {
	s.logger.Error("chimps database operation failed", "operation", operation, "error", err.Error())
	writeError(w, http.StatusInternalServerError, "database_error", "Database operation failed.")
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Invalid body.")
		return false
	}
	return true
}

func mapRow(item *db.Map) chimpsapi.MapRow {
	return chimpsapi.MapRow{
		Id: item.ID, Name: item.Name, Difficulty: mapDifficulty(item.Difficulty), ImageUrl: item.ImageUrl,
		NkMapId: item.NkMapID, NkImageUrl: item.NkImageUrl, Plays: item.Plays, Wins: item.Wins,
		Upvotes: item.Upvotes, LastSyncedAt: timestampPointer(item.LastSyncedAt),
		CreatedAt: item.CreatedAt.Time, UpdatedAt: item.UpdatedAt.Time,
	}
}

func strategyRow(item *db.Strategy) chimpsapi.StrategyRow {
	return chimpsapi.StrategyRow{
		Id: item.ID, MapId: item.MapID, GameModeId: item.GameModeID, Title: item.Title,
		Description: item.Description, HeroId: item.HeroID, SourceUrl: item.SourceUrl,
		VerifiedVersion: item.VerifiedVersion, ExecDifficulty: int16Pointer(item.ExecDifficulty),
		Status: chimpsapi.StrategyStatus(item.Status), Score: int32Pointer(item.Score),
		CreatedAt: item.CreatedAt.Time, UpdatedAt: item.UpdatedAt.Time,
	}
}

func placementRow(item *db.Placement) chimpsapi.PlacementRow {
	return chimpsapi.PlacementRow{
		Id: item.ID, StrategyId: item.StrategyID, TowerId: item.TowerID,
		PosX: item.PosX, PosY: item.PosY, FinalPath: item.FinalPath, Label: item.Label, Notes: item.Notes,
	}
}

func stepRow(item *db.Step) chimpsapi.StepRow {
	return chimpsapi.StepRow{
		Id: item.ID, StrategyId: item.StrategyID, PlacementId: item.PlacementID,
		RoundNumber: int(item.RoundNumber), Action: chimpsapi.StepAction(item.Action),
		TargetPath: item.TargetPath, Description: item.Description, OrderIndex: int(item.OrderIndex),
	}
}

func towerRow(item *db.Tower) chimpsapi.TowerRow {
	iconURL := towerIconURL(item.IconPath)
	return chimpsapi.TowerRow{
		Id: item.ID, Name: item.Name, Category: chimpsapi.TowerCategory(item.Category),
		BaseCost: int32Pointer(item.BaseCost), IconPath: item.IconPath, IconUrl: iconURL,
		Description: item.Description, AttackStyle: item.AttackStyle, XpRatio: numericPointer(item.XpRatio),
		TechnicalDescription: item.TechnicalDescription, ProfileSourceUrl: item.ProfileSourceUrl,
	}
}

func createStrategyParams(input chimpsapi.StrategyInput) db.CreateStudioStrategyParams {
	return db.CreateStudioStrategyParams{
		MapID: input.MapId, GameModeID: input.GameModeId, Title: input.Title,
		Description: input.Description, HeroID: input.HeroId, SourceUrl: input.SourceUrl,
		VerifiedVersion: input.VerifiedVersion, ExecDifficulty: intPointer16(input.ExecDifficulty), Status: string(input.Status),
	}
}

func updateStrategyParams(input chimpsapi.StrategyInput) db.UpdateStudioStrategyParams {
	return db.UpdateStudioStrategyParams{
		MapID: input.MapId, GameModeID: input.GameModeId, Title: input.Title,
		Description: input.Description, HeroID: input.HeroId, SourceUrl: input.SourceUrl,
		VerifiedVersion: input.VerifiedVersion, ExecDifficulty: intPointer16(input.ExecDifficulty), Status: string(input.Status),
	}
}

func towerIconURL(iconPath string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/tower-icons/%s", strings.TrimRight(os.Getenv("PUBLIC_SUPABASE_URL"), "/"), iconPath)
}

func mapDifficulty(value *string) *chimpsapi.MapDifficulty {
	if value == nil {
		return nil
	}
	converted := chimpsapi.MapDifficulty(*value)
	return &converted
}

func timestampPointer(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}

func numericPointer(value pgtype.Numeric) *float64 {
	if !value.Valid {
		return nil
	}
	converted, err := value.Float64Value()
	if err != nil || !converted.Valid {
		return nil
	}
	return &converted.Float64
}

func int16Pointer(value *int16) *int {
	if value == nil {
		return nil
	}
	converted := int(*value)
	return &converted
}

func int32Pointer(value *int32) *int {
	if value == nil {
		return nil
	}
	converted := int(*value)
	return &converted
}

func intPointer16(value *int) *int16 {
	if value == nil {
		return nil
	}
	converted := int16(*value)
	return &converted
}

func intPointer32(value *int) *int32 {
	if value == nil {
		return nil
	}
	converted := int32(*value)
	return &converted
}

func indexOf(values []int64, target int64) int {
	for index, value := range values {
		if value == target {
			return index
		}
	}
	return -1
}

func allowedHeroProfileError(message string) bool {
	allowed := map[string]struct{}{
		"hero_id must reference a Hero tower":                            {},
		"base_cost must be non-negative":                                 {},
		"xp_ratio must be positive":                                      {},
		"profile_source_url must be an HTTP or HTTPS URL":                {},
		"each synergy tower ID must have one matching description":       {},
		"synergy tower IDs cannot be null or reference the edited tower": {},
		"synergy tower IDs must be unique":                               {},
		"synergies must reference existing towers":                       {},
	}
	_, ok := allowed[message]
	return ok
}
