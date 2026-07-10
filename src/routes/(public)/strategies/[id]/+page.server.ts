import { error } from '@sveltejs/kit';
import { canonicalUrl, getStrategyDetail } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const strategy = await getStrategyDetail(Number(params.id));
	if (!strategy) error(404, 'Strategy not found');
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategy,
		canonical: canonicalUrl(url, `/strategies/${strategy.id}`)
	};
};
