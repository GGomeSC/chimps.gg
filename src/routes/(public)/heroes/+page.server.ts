import { canonicalUrl, getHeroes } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const heroes = await getHeroes();
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800' });
	return { heroes, canonical: canonicalUrl(url, '/heroes') };
};
