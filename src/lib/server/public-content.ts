import { env } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createPublicApi
} from '$lib/server/chimps-client';
import { withRuntimeCache } from '$lib/server/runtime-cache';
import type { MapDifficulty } from '$lib/types/db';
import type {
	HeroSummary,
	HomeMap,
	PublicHeroDetail,
	PublicHeroReference,
	PublicMap,
	PublicMode,
	PublicStrategyDetail,
	PublicStrategySummary,
	StrategyFilterOptions,
	StrategyFilters
} from '$lib/types/public';

const REFERENCE_CACHE_TTL = 60 * 60;
const STRATEGY_METADATA_CACHE_TTL = 5 * 60;
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

type ReferenceData = {
	maps: PublicMap[];
	modes: PublicMode[];
	heroes: PublicHeroReference[];
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

export async function getHeroes(fetcher: typeof fetch, origin: string): Promise<HeroSummary[]> {
	return loadPublicHeroes(fetcher, origin);
}

export async function getHeroDetail(
	fetcher: typeof fetch,
	origin: string,
	id: number
): Promise<PublicHeroDetail | null> {
	if (!Number.isInteger(id) || id < 1) return null;
	try {
		return await createPublicApi(fetcher, origin).getHero(id);
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'hero_not_found') return null;
		throw publicDataError('hero detail', chimpsErrorMessage(cause, 'Internal service error'));
	}
}

export async function getSitemapEntries(
	fetcher: typeof fetch,
	origin: string
): Promise<{ strategyIds: number[]; heroIds: number[] }> {
	try {
		return await createPublicApi(fetcher, origin).getSitemapEntries();
	} catch (cause) {
		throw publicDataError(
			'sitemap entries',
			chimpsErrorMessage(cause, 'Internal service error')
		);
	}
}

async function loadReferenceData(fetcher: typeof fetch, origin: string): Promise<ReferenceData> {
	return withRuntimeCache(
		'reference-data-v2',
		async () => {
			try {
				return await createPublicApi(fetcher, origin).getReferences();
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

async function loadPublicHeroes(fetcher: typeof fetch, origin: string): Promise<HeroSummary[]> {
	return withRuntimeCache(
		'public-heroes-v1',
		async () => {
			try {
				return (await createPublicApi(fetcher, origin).getHeroes()).heroes;
			} catch (cause) {
				throw publicDataError('heroes', chimpsErrorMessage(cause, 'Internal service error'));
			}
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

function integer(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validReferenceId(value: string | null, rows: Array<{ id: number }>): number | null {
	const id = integer(value);
	return id && rows.some((row) => row.id === id) ? id : null;
}

function publicDataError(area: string, detail: string): ReturnType<typeof error> {
	console.error(`Failed to load ${area}: ${detail}`);
	return error(500, 'Public content is temporarily unavailable');
}
