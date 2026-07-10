import {
	canonicalUrl,
	getHeroes,
	getLatestStrategies,
	getReadyStrategyCount
} from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const [strategies, heroes, readyCount] = await Promise.all([
		getLatestStrategies(6),
		getHeroes(),
		getReadyStrategyCount()
	]);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategies,
		heroes: [...heroes]
			.sort((a, b) => b.guideCount - a.guideCount || a.name.localeCompare(b.name))
			.slice(0, 6),
		stats: {
			readyCount,
			heroCount: heroes.length,
			latestVersion: strategies[0]?.verifiedVersion ?? null
		},
		canonical: canonicalUrl(url, '/')
	};
};
