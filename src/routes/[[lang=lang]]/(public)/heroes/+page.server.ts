import { localizeHref, pathnameLocale } from '$lib/i18n';
import { canonicalUrl, getHeroes } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const heroes = await getHeroes(fetch, url.origin);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		// Heroes with real guide coverage lead; the rest stay alphabetical.
		heroes: [...heroes].sort(
			(a, b) => b.guideCount - a.guideCount || a.name.localeCompare(b.name)
		),
		canonical: canonicalUrl(url, localizeHref('/heroes', pathnameLocale(url.pathname)))
	};
};
