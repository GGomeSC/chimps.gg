package chimps

import (
	"net/http"

	chimpsapi "github.com/GGomeSC/chimps.gg/go/generated/api"
)

type stubServer struct{}

func notImplemented(w http.ResponseWriter) {
	writeError(w, http.StatusNotImplemented, "not_implemented", "Operation not implemented.")
}

func (stubServer) GetPublicHeroes(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetPublicHero(w http.ResponseWriter, _ *http.Request, _ chimpsapi.HeroId) {
	notImplemented(w)
}

func (stubServer) GetPublicLatestStrategies(w http.ResponseWriter, _ *http.Request, _ chimpsapi.GetPublicLatestStrategiesParams) {
	notImplemented(w)
}

func (stubServer) GetPublicHomeMaps(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetPublicReferences(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetPublicSitemapEntries(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) DiscoverPublicStrategies(w http.ResponseWriter, _ *http.Request, _ chimpsapi.DiscoverPublicStrategiesParams) {
	notImplemented(w)
}

func (stubServer) GetPublicStrategy(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) GetPublicVersions(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetStudioHeroes(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetStudioHero(w http.ResponseWriter, _ *http.Request, _ chimpsapi.HeroId) {
	notImplemented(w)
}

func (stubServer) UpdateStudioHeroProfile(w http.ResponseWriter, _ *http.Request, _ chimpsapi.HeroId) {
	notImplemented(w)
}

func (stubServer) GetStudioMaps(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) GetStudioStrategies(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) CreateStudioStrategy(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}

func (stubServer) DeleteStudioStrategy(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) GetStudioStrategy(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) UpdateStudioStrategyMetadata(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) CreateStudioPlacement(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) DeleteStudioPlacement(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId, _ chimpsapi.PlacementId) {
	notImplemented(w)
}

func (stubServer) UpdateStudioPlacement(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId, _ chimpsapi.PlacementId) {
	notImplemented(w)
}

func (stubServer) CreateStudioStep(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId) {
	notImplemented(w)
}

func (stubServer) DeleteStudioStep(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId, _ chimpsapi.StepId) {
	notImplemented(w)
}

func (stubServer) UpdateStudioStep(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId, _ chimpsapi.StepId) {
	notImplemented(w)
}

func (stubServer) MoveStudioStep(w http.ResponseWriter, _ *http.Request, _ chimpsapi.StrategyId, _ chimpsapi.StepId) {
	notImplemented(w)
}

func (stubServer) GetStudioStrategyReferences(w http.ResponseWriter, _ *http.Request) {
	notImplemented(w)
}
