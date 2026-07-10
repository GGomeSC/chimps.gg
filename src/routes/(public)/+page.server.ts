import {
	canonicalUrl,
	getHomeMaps,
	getLatestStrategies,
	getReadyStrategyCount
} from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const [strategies, maps, readyCount] = await Promise.all([
		getLatestStrategies(6),
		getHomeMaps(),
		getReadyStrategyCount()
	]);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategies,
		maps,
		readyCount,
		canonical: canonicalUrl(url, '/')
	};
};
