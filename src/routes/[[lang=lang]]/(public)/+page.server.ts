import { localizeHref, pathnameLocale } from '$lib/i18n';
import {
	canonicalUrl,
	getHomeMaps,
	getLatestStrategies
} from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const [strategies, maps] = await Promise.all([
		getLatestStrategies(fetch, url.origin, 6),
		getHomeMaps(fetch, url.origin)
	]);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategies,
		maps,
		guideCount: maps.reduce((total, map) => total + map.guideCount, 0),
		mapCount: maps.filter((map) => map.guideCount > 0).length,
		canonical: canonicalUrl(url, localizeHref('/', pathnameLocale(url.pathname)))
	};
};
