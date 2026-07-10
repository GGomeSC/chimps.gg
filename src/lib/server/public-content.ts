import { env } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { towerIconUrl } from '$lib/server/tower-icons';
import { toStrategyMapPlacement, toStrategyMapTower } from '$lib/strategy-map';
import type {
	GameModeRow,
	MapDifficulty,
	MapRow,
	StrategyRow,
	TowerRow
} from '$lib/types/db';
import type {
	HeroSummary,
	PublicHeroDetail,
	PublicHeroReference,
	PublicMap,
	PublicMode,
	PublicStrategyDetail,
	PublicStrategySummary,
	StrategyFilterOptions,
	StrategyFilters
} from '$lib/types/public';

const PAGE_SIZE = 24;
const MAP_DIFFICULTIES: readonly MapDifficulty[] = [
	'Beginner',
	'Intermediate',
	'Advanced',
	'Expert'
];

type ReferenceData = {
	maps: MapRow[];
	modes: GameModeRow[];
	heroes: TowerRow[];
};

export type StrategyDiscovery = {
	strategies: PublicStrategySummary[];
	filters: StrategyFilters;
	options: StrategyFilterOptions;
	totalCount: number;
	nextCursor: number | null;
};

export function canonicalUrl(requestUrl: URL, pathname: string): string {
	const configured = env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
	return new URL(pathname, configured || requestUrl.origin).toString();
}

export async function getLatestStrategies(limit = 6): Promise<PublicStrategySummary[]> {
	const [strategies, references] = await Promise.all([
		supabase
			.from('strategies')
			.select('*')
			.eq('status', 'ready')
			.order('id', { ascending: false })
			.limit(limit),
		loadReferenceData()
	]);
	if (strategies.error) throw publicDataError('latest strategies', strategies.error.message);
	return strategies.data
		.map((strategy) => toStrategySummary(strategy, references))
		.filter((strategy) => strategy !== null);
}

export async function discoverStrategies(url: URL): Promise<StrategyDiscovery> {
	const [references, versionRows] = await Promise.all([
		loadReferenceData(),
		supabase
			.from('strategies')
			.select('verified_version')
			.eq('status', 'ready')
			.not('verified_version', 'is', null)
	]);
	if (versionRows.error) throw publicDataError('strategy versions', versionRows.error.message);

	const versions = [
		...new Set(versionRows.data.map((row) => row.verified_version).filter(isString))
	].sort(compareVersionsDescending);
	const filters = parseFilters(url.searchParams, references, versions);

	const match: Partial<StrategyRow> = { status: 'ready' };
	if (filters.mapId) match.map_id = filters.mapId;
	if (filters.modeId) match.game_mode_id = filters.modeId;
	if (filters.heroId) match.hero_id = filters.heroId;
	if (filters.executionDifficulty) match.exec_difficulty = filters.executionDifficulty;
	if (filters.version) match.verified_version = filters.version;
	const mapIds = filters.mapDifficulty
		? references.maps
				.filter((map) => map.difficulty === filters.mapDifficulty)
				.map((map) => map.id)
		: null;

	// The count query deliberately omits the cursor so totalCount stays the full
	// result-set size on every page, not the rows past the cursor.
	let countQuery = supabase
		.from('strategies')
		.select('id', { count: 'exact', head: true })
		.match(match);
	let pageQuery = supabase
		.from('strategies')
		.select('*')
		.match(match)
		.order('id', { ascending: false })
		.limit(PAGE_SIZE + 1);
	if (mapIds) {
		countQuery = countQuery.in('map_id', mapIds);
		pageQuery = pageQuery.in('map_id', mapIds);
	}
	if (filters.cursor) pageQuery = pageQuery.lt('id', filters.cursor);

	const [countResult, pageResult] = await Promise.all([countQuery, pageQuery]);
	if (countResult.error) throw publicDataError('strategy count', countResult.error.message);
	if (pageResult.error) throw publicDataError('strategy discovery', pageResult.error.message);
	const hasMore = pageResult.data.length > PAGE_SIZE;
	const page = pageResult.data.slice(0, PAGE_SIZE);

	return {
		strategies: page
			.map((strategy) => toStrategySummary(strategy, references))
			.filter((strategy) => strategy !== null),
		filters,
		options: filterOptions(references, versions),
		totalCount: countResult.count ?? page.length,
		nextCursor: hasMore ? page.at(-1)?.id ?? null : null
	};
}

export async function getStrategyDetail(id: number): Promise<PublicStrategyDetail | null> {
	if (!Number.isInteger(id) || id < 1) return null;
	const strategyResult = await supabase
		.from('strategies')
		.select('*')
		.eq('id', id)
		.eq('status', 'ready')
		.maybeSingle();
	if (strategyResult.error) {
		throw publicDataError('strategy detail', strategyResult.error.message);
	}
	if (!strategyResult.data) return null;
	const strategy = strategyResult.data;

	const [mapResult, modeResult, heroResult, placementResult, stepResult] = await Promise.all([
		supabase.from('maps').select('*').eq('id', strategy.map_id).single(),
		supabase.from('game_modes').select('*').eq('id', strategy.game_mode_id).single(),
		strategy.hero_id
			? supabase
					.from('towers')
					.select('*')
					.eq('id', strategy.hero_id)
					.eq('category', 'Hero')
					.maybeSingle()
			: Promise.resolve({ data: null, error: null }),
		supabase.from('placements').select('*').eq('strategy_id', strategy.id).order('id'),
		supabase.from('steps').select('*').eq('strategy_id', strategy.id).order('order_index')
	]);
	const firstError = [mapResult, modeResult, heroResult, placementResult, stepResult].find(
		(result) => result.error
	);
	if (firstError?.error) throw publicDataError('strategy relations', firstError.error.message);
	if (!mapResult.data || !modeResult.data || !placementResult.data || !stepResult.data) {
		throw publicDataError('strategy relations', `Incomplete strategy ${strategy.id}`);
	}

	const towerIds = [...new Set(placementResult.data.map((placement) => placement.tower_id))];
	const towersResult = towerIds.length
		? await supabase.from('towers').select('*').in('id', towerIds).order('name')
		: { data: [] as TowerRow[], error: null };
	if (towersResult.error) throw publicDataError('strategy towers', towersResult.error.message);

	const references: ReferenceData = {
		maps: [mapResult.data],
		modes: [modeResult.data],
		heroes: heroResult.data ? [heroResult.data] : []
	};

	// A ready strategy with drifted references (e.g. its hero tower was
	// recategorized) is not publicly renderable; treat it as not found.
	const summary = toStrategySummary(strategy, references);
	if (!summary) return null;

	return {
		...summary,
		sourceUrl: strategy.source_url,
		placements: placementResult.data.map(toStrategyMapPlacement),
		towers: (towersResult.data ?? []).map((tower) =>
			toStrategyMapTower(tower, towerIconUrl(tower.icon_path))
		),
		steps: stepResult.data.map((step) => ({
			id: step.id,
			placementId: step.placement_id,
			roundNumber: step.round_number,
			action: step.action,
			targetPath: step.target_path,
			description: step.description,
			orderIndex: step.order_index
		}))
	};
}

export async function getHeroes(): Promise<HeroSummary[]> {
	const [heroesResult, strategiesResult] = await Promise.all([
		supabase.from('towers').select('*').eq('category', 'Hero').order('name'),
		supabase.from('strategies').select('hero_id').eq('status', 'ready').not('hero_id', 'is', null)
	]);
	if (heroesResult.error) throw publicDataError('heroes', heroesResult.error.message);
	if (strategiesResult.error) {
		throw publicDataError('hero guide counts', strategiesResult.error.message);
	}
	const counts = new Map<number, number>();
	for (const strategy of strategiesResult.data) {
		if (strategy.hero_id) counts.set(strategy.hero_id, (counts.get(strategy.hero_id) ?? 0) + 1);
	}
	return heroesResult.data.map((hero) => ({
		...toHeroReference(hero),
		guideCount: counts.get(hero.id) ?? 0
	}));
}

export async function getHeroDetail(id: number): Promise<PublicHeroDetail | null> {
	if (!Number.isInteger(id) || id < 1) return null;
	const [heroResult, strategyResult, references] = await Promise.all([
		supabase.from('towers').select('*').eq('id', id).eq('category', 'Hero').maybeSingle(),
		supabase
			.from('strategies')
			.select('*')
			.eq('hero_id', id)
			.eq('status', 'ready')
			.order('id', { ascending: false }),
		loadReferenceData()
	]);
	if (heroResult.error) throw publicDataError('hero detail', heroResult.error.message);
	if (strategyResult.error) throw publicDataError('hero strategies', strategyResult.error.message);
	if (!heroResult.data) return null;

	const strategies = strategyResult.data
		.map((strategy) => toStrategySummary(strategy, references))
		.filter((strategy) => strategy !== null);
	return {
		...toHeroReference(heroResult.data),
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

async function loadReferenceData(): Promise<ReferenceData> {
	const [maps, modes, heroes] = await Promise.all([
		supabase.from('maps').select('*').order('name'),
		supabase.from('game_modes').select('*').order('id'),
		supabase.from('towers').select('*').eq('category', 'Hero').order('name')
	]);
	const firstError = [maps, modes, heroes].find((result) => result.error);
	if (firstError?.error) throw publicDataError('reference data', firstError.error.message);
	return { maps: maps.data ?? [], modes: modes.data ?? [], heroes: heroes.data ?? [] };
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
	strategy: StrategyRow,
	references: ReferenceData
): PublicStrategySummary | null {
	const map = references.maps.find((item) => item.id === strategy.map_id);
	const mode = references.modes.find((item) => item.id === strategy.game_mode_id);
	const hero = strategy.hero_id
		? references.heroes.find((item) => item.id === strategy.hero_id)
		: null;
	if (!map || !mode || (strategy.hero_id && !hero) || !strategy.verified_version) {
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
		updatedAt: strategy.updated_at
	};
}

function toPublicMap(map: MapRow): PublicMap {
	return {
		id: map.id,
		name: map.name,
		difficulty: map.difficulty,
		imageUrl: map.image_url ?? map.nk_image_url
	};
}

function toHeroReference(hero: TowerRow): PublicHeroReference {
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
