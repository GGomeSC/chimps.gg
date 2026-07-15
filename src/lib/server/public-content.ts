import { env } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createPublicApi
} from '$lib/server/chimps-client';
import { withRuntimeCache } from '$lib/server/runtime-cache';
import { supabase } from '$lib/server/supabase';
import { towerIconUrl } from '$lib/server/tower-icons';
import { toStrategyMapPlacement, toStrategyMapTower } from '$lib/strategy-map';
import type {
	GameModeRow,
	MapDifficulty,
	MapRow,
	PlacementRow,
	StepRow,
	StrategyRow,
	TowerRow
} from '$lib/types/db';
import type {
	HeroSummary,
	HomeMap,
	PublicHeroDetail,
	PublicHeroReference,
	PublicMap,
	PublicStrategyDetail,
	PublicStrategySummary,
	StrategyFilterOptions,
	StrategyFilters
} from '$lib/types/public';

const REFERENCE_CACHE_TTL = 60 * 60;
const STRATEGY_METADATA_CACHE_TTL = 5 * 60;
const STRATEGY_BASE_SELECT = `
	id,
	title,
	description,
	hero_id,
	verified_version,
	exec_difficulty,
	map:maps!strategies_map_id_fkey(id,name,difficulty,image_url,nk_image_url),
	mode:game_modes!strategies_game_mode_id_fkey(id,name),
	hero:towers!strategies_hero_id_fkey(id,name,category,icon_path)
`;
// Summaries carry lightweight placement dots (normalized floats) so cards can
// overlay the final layout on the map art without a detail round-trip.
const STRATEGY_SUMMARY_SELECT = `
	${STRATEGY_BASE_SELECT},
	placements(id,tower_id,pos_x,pos_y)
`;
const STRATEGY_DETAIL_SELECT = `
	${STRATEGY_BASE_SELECT},
	source_url,
	placements(
		id,
		tower_id,
		pos_x,
		pos_y,
		final_path,
		label,
		tower:towers!placements_tower_id_fkey(id,name,category,icon_path)
	),
	steps(id,placement_id,round_number,action,target_path,description,order_index)
`;
const HERO_DETAIL_SELECT = `
	id,
	name,
	category,
	icon_path,
	description,
	base_cost,
	attack_style,
	xp_ratio,
	technical_description,
	profile_source_url,
	synergies_from_a:tower_synergies!tower_synergies_tower_a_id_fkey(
		id,
		description,
		tower:towers!tower_synergies_tower_b_id_fkey(id,name,category,icon_path)
	),
	synergies_from_b:tower_synergies!tower_synergies_tower_b_id_fkey(
		id,
		description,
		tower:towers!tower_synergies_tower_a_id_fkey(id,name,category,icon_path)
	),
	strategies:strategies!strategies_hero_id_fkey(
		id,
		title,
		description,
		hero_id,
		verified_version,
		exec_difficulty,
		map:maps!strategies_map_id_fkey(id,name,difficulty,image_url,nk_image_url),
		mode:game_modes!strategies_game_mode_id_fkey(id,name),
		placements(id,tower_id,pos_x,pos_y)
	)
`;
const MAP_DIFFICULTIES: readonly MapDifficulty[] = [
	'Beginner',
	'Intermediate',
	'Advanced',
	'Expert'
];
const MAP_GAME_ORDER: Record<MapDifficulty, readonly string[]> = {
	Beginner: [
		'Monkey Meadow', 'In The Loop', 'Skull Tweak', "Three Mines 'Round", 'Spa Pits',
		'Tinkerton', 'Tree Stump', 'Town Center', 'Middle of the Road', 'One Two Tree',
		'Scrapyard', 'The Cabin', 'Resort', 'Skates', 'Lotus Island', 'Candy Falls',
		'Winter Park', 'Carved', 'Park Path', 'Alpine Run', 'Frozen Over', 'Cubism',
		'Four Circles', 'Hedge', 'End of the Road', 'Logs'
	],
	Intermediate: [
		'Lost Crevasse', 'Luminous Cove', 'Ancient Portal', 'Sulfur Springs', 'Water Park',
		'Polyphemus', 'Covered Garden', 'Quarry', 'Quiet Street', 'Bloonarius Prime',
		'Balance', 'Encrypted', 'Bazaar', "Adora's Temple", 'Spring Spring', 'KartsNDarts',
		'Moon Landing', 'Haunted', 'Downstream', 'Firing Range', 'Cracked', 'Streambed',
		'Chutes', 'Rake', 'Spice Islands'
	],
	Advanced: [
		'Mushroom Grotto', 'Party Parade', 'Sunset Gulch', 'Enchanted Glade', 'Last Resort',
		'Castle Revenge', 'Dark Path', 'Erosion', 'Midnight Mansion', 'Sunken Columns',
		'X Factor', 'Mesa', 'Geared', 'Spillway', 'Cargo', "Pat's Pond", 'Peninsula',
		'High Finance', 'Another Brick', 'Off The Coast', 'Cornfield', 'Underground'
	],
	Expert: [
		'Glacial Trail', 'Dark Dungeons', 'Sanctuary', 'Ravine', 'Flooded Valley', 'Infernal',
		'Bloody Puddles', 'Workshop', 'Quad', 'Dark Castle', 'Muddy Puddles', '#Ouch', 'Blons'
	]
};

type MapReference = Pick<MapRow, 'id' | 'name' | 'difficulty' | 'image_url' | 'nk_image_url'>;
type ModeReference = Pick<GameModeRow, 'id' | 'name'>;
type HeroReference = Pick<TowerRow, 'id' | 'name' | 'category' | 'icon_path'>;
type ReferenceData = {
	maps: MapReference[];
	modes: ModeReference[];
	heroes: HeroReference[];
};

type StrategySummaryRecord = Pick<
	StrategyRow,
	| 'id'
	| 'title'
	| 'description'
	| 'hero_id'
	| 'verified_version'
	| 'exec_difficulty'
> & {
	map: MapReference | null;
	mode: ModeReference | null;
	hero: HeroReference | null;
	placements: Array<Pick<PlacementRow, 'id' | 'tower_id' | 'pos_x' | 'pos_y'>>;
};

type StrategyDetailRecord = Omit<StrategySummaryRecord, 'placements'> &
	Pick<StrategyRow, 'source_url'> & {
		placements: Array<
			Pick<
				PlacementRow,
				'id' | 'tower_id' | 'pos_x' | 'pos_y' | 'final_path' | 'label'
			> & { tower: HeroReference | null }
		>;
		steps: Array<
			Pick<
				StepRow,
				| 'id'
				| 'placement_id'
				| 'round_number'
				| 'action'
				| 'target_path'
				| 'description'
				| 'order_index'
			>
		>;
	};

type HeroDetailRecord = HeroReference &
	Pick<
		TowerRow,
		| 'description'
		| 'base_cost'
		| 'attack_style'
		| 'xp_ratio'
		| 'technical_description'
		| 'profile_source_url'
	> & {
	synergies_from_a: Array<{
		id: number;
		description: string | null;
		tower: HeroReference | null;
	}>;
	synergies_from_b: Array<{
		id: number;
		description: string | null;
		tower: HeroReference | null;
	}>;
	strategies: Array<Omit<StrategySummaryRecord, 'hero'>>;
};

type StrategyDiscovery = {
	strategies: PublicStrategySummary[];
	filters: StrategyFilters;
	options: StrategyFilterOptions;
	nextCursor: number | null;
};

export function canonicalUrl(requestUrl: URL, pathname: string): string {
	const configured = env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
	return new URL(pathname, configured || requestUrl.origin).toString();
}

export async function getLatestStrategies(
	fetcher: typeof fetch,
	origin: string,
	limit = 6
): Promise<PublicStrategySummary[]> {
	try {
		return (await createPublicApi(fetcher, origin).getLatestStrategies(limit)).strategies;
	} catch (cause) {
		throw publicDataError(
			'latest strategies',
			chimpsErrorMessage(cause, 'Internal service error')
		);
	}
}

export async function getHomeMaps(fetcher: typeof fetch, origin: string): Promise<HomeMap[]> {
	try {
		const { maps } = await createPublicApi(fetcher, origin).getHomeMaps();
		return [...maps].sort((a, b) => {
			if (a.difficulty !== b.difficulty) {
				return MAP_DIFFICULTIES.indexOf(a.difficulty!) - MAP_DIFFICULTIES.indexOf(b.difficulty!);
			}
			const order = MAP_GAME_ORDER[a.difficulty!];
			const aIndex = order.findIndex((name) => name.toLocaleLowerCase() === a.name.toLocaleLowerCase());
			const bIndex = order.findIndex((name) => name.toLocaleLowerCase() === b.name.toLocaleLowerCase());
			if (aIndex === -1 || bIndex === -1) {
				if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
				return aIndex === -1 ? 1 : -1;
			}
			return aIndex - bIndex;
		});
	} catch (cause) {
		throw publicDataError(
			'map guide counts',
			chimpsErrorMessage(cause, 'Internal service error')
		);
	}
}

export async function discoverStrategies(
	fetcher: typeof fetch,
	url: URL
): Promise<StrategyDiscovery> {
	const [references, versions] = await Promise.all([
		loadReferenceData(fetcher, url.origin),
		loadStrategyVersions(fetcher, url.origin)
	]);
	const filters = parseFilters(url.searchParams, references, versions);

	try {
		const page = await createPublicApi(fetcher, url.origin).discoverStrategies({
			...(filters.mapId ? { mapId: filters.mapId } : {}),
			...(filters.modeId ? { modeId: filters.modeId } : {}),
			...(filters.heroId ? { heroId: filters.heroId } : {}),
			...(filters.executionDifficulty
				? { executionDifficulty: filters.executionDifficulty }
				: {}),
			...(filters.mapDifficulty ? { mapDifficulty: filters.mapDifficulty } : {}),
			...(filters.version ? { version: filters.version } : {}),
			...(filters.cursor ? { cursor: filters.cursor } : {})
		});
		return {
			strategies: page.strategies,
			filters,
			options: filterOptions(references, versions),
			nextCursor: page.nextCursor
		};
	} catch (cause) {
		throw publicDataError(
			'strategy discovery',
			chimpsErrorMessage(cause, 'Internal service error')
		);
	}
}

export async function getStrategyDetail(
	fetcher: typeof fetch,
	origin: string,
	id: number
): Promise<PublicStrategyDetail | null> {
	if (!Number.isInteger(id) || id < 1) return null;
	try {
		return await createPublicApi(fetcher, origin).getStrategy(id);
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'strategy_not_found') return null;
		throw publicDataError(
			'strategy detail',
			chimpsErrorMessage(cause, 'Internal service error')
		);
	}
}

export async function getHeroes(): Promise<HeroSummary[]> {
	return loadPublicHeroes();
}

export async function getHeroDetail(id: number): Promise<PublicHeroDetail | null> {
	if (!Number.isInteger(id) || id < 1) return null;
	const heroResult = await supabase
		.from('towers')
		.select(HERO_DETAIL_SELECT)
		.eq('id', id)
		.eq('category', 'Hero')
		.eq('strategies.status', 'ready')
		.maybeSingle();
	if (heroResult.error) throw publicDataError('hero detail', heroResult.error.message);
	if (!heroResult.data) return null;
	const hero = heroResult.data as HeroDetailRecord;
	const strategies = hero.strategies
		.map((strategy) => toStrategySummary({ ...strategy, hero }))
		.filter((strategy) => strategy !== null);
	strategies.sort((a, b) => b.id - a.id);
	return {
		...toHeroReference(hero),
		description: hero.description,
		baseCost: hero.base_cost,
		attackStyle: hero.attack_style,
		xpRatio: hero.xp_ratio,
		technicalDescription: hero.technical_description,
		profileSourceUrl: hero.profile_source_url,
		synergies: [...hero.synergies_from_a, ...hero.synergies_from_b]
			.filter(
				(synergy): synergy is typeof synergy & { tower: HeroReference } => synergy.tower !== null
			)
			.map((synergy) => ({
				id: synergy.tower.id,
				name: synergy.tower.name,
				description: synergy.description
			}))
			.sort((a, b) => a.name.localeCompare(b.name)),
		guideCount: strategies.length,
		strategies,
		maps: uniqueBy(strategies.map((strategy) => strategy.map), (map) => map.id),
		modes: uniqueBy(strategies.map((strategy) => strategy.mode), (mode) => mode.id),
		versions: [...new Set(strategies.map((strategy) => strategy.verifiedVersion))].sort(
			compareVersionsDescending
		)
	};
}

export async function getSitemapEntries(): Promise<{ strategyIds: number[]; heroIds: number[] }> {
	const [strategies, heroes] = await Promise.all([
		supabase.from('strategies').select('id').eq('status', 'ready').order('id'),
		supabase.from('towers').select('id').eq('category', 'Hero').order('id')
	]);
	if (strategies.error) throw publicDataError('sitemap strategies', strategies.error.message);
	if (heroes.error) throw publicDataError('sitemap heroes', heroes.error.message);
	return {
		strategyIds: strategies.data.map((strategy) => strategy.id),
		heroIds: heroes.data.map((hero) => hero.id)
	};
}

async function loadReferenceData(fetcher: typeof fetch, origin: string): Promise<ReferenceData> {
	return withRuntimeCache(
		'reference-data-v2',
		async () => {
			try {
				const result = await createPublicApi(fetcher, origin).getReferences();
				return {
					maps: result.maps.map((map) => ({
						id: map.id,
						name: map.name,
						difficulty: map.difficulty,
						image_url: map.imageUrl,
						nk_image_url: null
					})),
					modes: result.modes,
					heroes: result.heroes.map((hero) => ({
						id: hero.id,
						name: hero.name,
						category: 'Hero' as const,
						icon_path: ''
					}))
				};
			} catch (cause) {
				throw publicDataError(
					'reference data',
					chimpsErrorMessage(cause, 'Internal service error')
				);
			}
		},
		{
			ttl: REFERENCE_CACHE_TTL,
			tags: ['public-reference-data'],
			name: 'Public reference data'
		}
	);
}

async function loadStrategyVersions(fetcher: typeof fetch, origin: string): Promise<string[]> {
	return withRuntimeCache(
		'strategy-versions-v1',
		async () => {
			try {
				return (await createPublicApi(fetcher, origin).getVersions()).versions;
			} catch (cause) {
				throw publicDataError(
					'strategy versions',
					chimpsErrorMessage(cause, 'Internal service error')
				);
			}
		},
		{
			ttl: STRATEGY_METADATA_CACHE_TTL,
			tags: ['public-strategy-metadata'],
			name: 'Public strategy versions'
		}
	);
}

async function loadPublicHeroes(): Promise<HeroSummary[]> {
	return withRuntimeCache(
		'public-heroes-v1',
		async () => {
			const result = await supabase.rpc('get_public_heroes');
			if (result.error) throw publicDataError('heroes', result.error.message);
			return result.data.map((hero) => ({
				id: hero.id,
				name: hero.name,
				iconUrl: towerIconUrl(hero.icon_path),
				guideCount: hero.guide_count
			}));
		},
		{
			ttl: STRATEGY_METADATA_CACHE_TTL,
			tags: ['public-strategy-metadata'],
			name: 'Public hero guide counts'
		}
	);
}

function parseFilters(
	params: URLSearchParams,
	references: ReferenceData,
	versions: string[]
): StrategyFilters {
	const mapId = validReferenceId(params.get('map'), references.maps);
	const modeId = validReferenceId(params.get('mode'), references.modes);
	const heroId = validReferenceId(params.get('hero'), references.heroes);
	const difficulty = integer(params.get('difficulty'));
	const mapDifficulty = params.get('mapDifficulty');
	const version = params.get('version');

	return {
		mapId,
		modeId,
		heroId,
		executionDifficulty: difficulty && difficulty >= 1 && difficulty <= 5 ? difficulty : null,
		mapDifficulty: MAP_DIFFICULTIES.includes(mapDifficulty as MapDifficulty)
			? (mapDifficulty as MapDifficulty)
			: null,
		version: version && versions.includes(version) ? version : null,
		cursor: integer(params.get('cursor'))
	};
}

function filterOptions(references: ReferenceData, versions: string[]): StrategyFilterOptions {
	return {
		maps: references.maps.map((map) => ({ id: map.id, name: map.name })),
		modes: references.modes.map((mode) => ({ id: mode.id, name: mode.name })),
		heroes: references.heroes.map((hero) => ({ id: hero.id, name: hero.name })),
		versions
	};
}

function toStrategySummary(
	strategy: StrategySummaryRecord
): PublicStrategySummary | null {
	const { map, mode, hero } = strategy;
	if (
		!map ||
		!mode ||
		(strategy.hero_id && (!hero || hero.category !== 'Hero')) ||
		!strategy.verified_version
	) {
		// One inconsistent row must not take down whole public pages; skip it.
		console.error(`Skipping incomplete ready strategy ${strategy.id}`);
		return null;
	}
	return {
		id: strategy.id,
		title: strategy.title,
		description: strategy.description,
		map: toPublicMap(map),
		mode: { id: mode.id, name: mode.name },
		hero: hero ? toHeroReference(hero) : null,
		verifiedVersion: strategy.verified_version,
		executionDifficulty: strategy.exec_difficulty,
		placementDots: [...strategy.placements]
			.sort((a, b) => a.id - b.id)
			.map((placement) => ({
				id: placement.id,
				x: placement.pos_x,
				y: placement.pos_y,
				isHero: strategy.hero_id !== null && placement.tower_id === strategy.hero_id
			}))
	};
}

function toPublicMap(map: MapReference): PublicMap {
	return {
		id: map.id,
		name: map.name,
		difficulty: map.difficulty,
		imageUrl: map.image_url ?? map.nk_image_url
	};
}

function toHeroReference(
	hero: Pick<TowerRow, 'id' | 'name' | 'icon_path'>
): PublicHeroReference {
	return { id: hero.id, name: hero.name, iconUrl: towerIconUrl(hero.icon_path) };
}

function integer(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validReferenceId(value: string | null, rows: Array<{ id: number }>): number | null {
	const id = integer(value);
	return id && rows.some((row) => row.id === id) ? id : null;
}

function isString(value: string | null): value is string {
	return typeof value === 'string' && value.length > 0;
}

function uniqueBy<T>(items: T[], key: (item: T) => number): T[] {
	return [...new Map(items.map((item) => [key(item), item])).values()];
}

function compareVersionsDescending(a: string, b: string): number {
	return b.localeCompare(a, undefined, { numeric: true });
}

function publicDataError(area: string, detail: string): ReturnType<typeof error> {
	console.error(`Failed to load ${area}: ${detail}`);
	return error(500, 'Public content is temporarily unavailable');
}
