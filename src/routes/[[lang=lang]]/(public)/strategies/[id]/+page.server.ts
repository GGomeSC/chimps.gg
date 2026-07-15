import { error } from '@sveltejs/kit';
import { localizeHref, pathnameLocale } from '$lib/i18n';
import { canonicalUrl, getStrategyDetail } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, url, setHeaders }) => {
	const strategy = await getStrategyDetail(fetch, url.origin, Number(params.id));
	if (!strategy) error(404, 'Strategy not found');
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategy,
		canonical: canonicalUrl(
			url,
			localizeHref(`/strategies/${strategy.id}`, pathnameLocale(url.pathname))
		)
	};
};
