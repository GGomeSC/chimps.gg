import { error } from '@sveltejs/kit';
import { localizeHref, pathnameLocale } from '$lib/i18n';
import { canonicalUrl, getHeroDetail } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const hero = await getHeroDetail(Number(params.id));
	if (!hero) error(404, 'Hero not found');
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		hero,
		canonical: canonicalUrl(url, localizeHref(`/heroes/${hero.id}`, pathnameLocale(url.pathname)))
	};
};
