import type { MapDifficulty, StepAction, TowerCategory } from './db';

export type PublicMap = {
	id: number;
	name: string;
	difficulty: MapDifficulty | null;
	imageUrl: string | null;
};

export type HomeMap = PublicMap & {
	guideCount: number;
};

export type PublicMode = {
	id: number;
	name: string;
};

export type PublicHeroReference = {
	id: number;
	name: string;
	iconUrl: string;
};

/** Lightweight final-layout marker for card overlays (normalized [0, 1] coords). */
type PlacementDot = {
	id: number;
	x: number;
	y: number;
	isHero: boolean;
};

export type PublicStrategySummary = {
	id: number;
	title: string;
	description: string | null;
	map: PublicMap;
	mode: PublicMode;
	hero: PublicHeroReference | null;
	verifiedVersion: string;
	executionDifficulty: number | null;
	placementDots: PlacementDot[];
};

export type StrategyMapPlacement = {
	id: number;
	towerId: number;
	x: number;
	y: number;
	finalPath: string | null;
	label: string | null;
};

export type StrategyMapTower = {
	id: number;
	name: string;
	category: TowerCategory;
	iconUrl: string;
};

export type PublicStep = {
	id: number;
	placementId: number | null;
	roundNumber: number;
	action: StepAction;
	targetPath: string | null;
	description: string | null;
};

export type PublicStrategyDetail = PublicStrategySummary & {
	sourceUrl: string | null;
	placements: StrategyMapPlacement[];
	towers: StrategyMapTower[];
	steps: PublicStep[];
};

export type HeroSummary = PublicHeroReference & {
	guideCount: number;
};

export type PublicHeroDetail = HeroSummary & {
	description: string | null;
	baseCost: number | null;
	attackStyle: string | null;
	xpRatio: number | null;
	technicalDescription: string | null;
	profileSourceUrl: string | null;
	synergies: Array<{ id: number; name: string; description: string | null }>;
	strategies: PublicStrategySummary[];
	maps: PublicMap[];
	modes: PublicMode[];
	versions: string[];
};

export type StrategyFilters = {
	mapId: number | null;
	modeId: number | null;
	heroId: number | null;
	executionDifficulty: number | null;
	mapDifficulty: MapDifficulty | null;
	version: string | null;
	cursor: number | null;
};

export type StrategyFilterOptions = {
	maps: Array<{ id: number; name: string }>;
	modes: PublicMode[];
	heroes: Array<{ id: number; name: string }>;
	versions: string[];
};
