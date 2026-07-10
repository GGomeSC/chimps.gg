import { canonicalUrl, getHeroes, getLatestStrategies } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const [strategies, heroes] = await Promise.all([getLatestStrategies(6), getHeroes()]);
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return {
		strategies,
		heroes: [...heroes]
			.sort((a, b) => b.guideCount - a.guideCount || a.name.localeCompare(b.name))
			.slice(0, 6),
		canonical: canonicalUrl(url, '/')
	};
};
