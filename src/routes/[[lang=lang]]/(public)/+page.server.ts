import { localizeHref, pathnameLocale } from '$lib/i18n';
import {
	canonicalUrl,
	getHomeMaps,
	getLatestStrategies
} from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const [strategies, maps] = await Promise.all([
		getLatestStrategies(6),
		getHomeMaps()
	]);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategies,
		maps,
		canonical: canonicalUrl(url, localizeHref('/', pathnameLocale(url.pathname)))
	};
};
