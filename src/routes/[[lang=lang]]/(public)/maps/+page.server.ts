import { localizeHref, pathnameLocale } from '$lib/i18n';
import { canonicalUrl, getHomeMaps } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const maps = await getHomeMaps(fetch, url.origin);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		maps,
		canonical: canonicalUrl(url, localizeHref('/maps', pathnameLocale(url.pathname)))
	};
};
