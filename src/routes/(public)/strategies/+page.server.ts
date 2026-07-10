import { canonicalUrl, discoverStrategies } from '$lib/server/public-content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const discovery = await discoverStrategies(url);
	const nextUrl = new URL(url);
	if (discovery.nextCursor) nextUrl.searchParams.set('cursor', String(discovery.nextCursor));
	else nextUrl.searchParams.delete('cursor');
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=180, stale-while-revalidate=900' });

	// Judge "filtered" by the parsed filters, not raw params: the GET form
	// submits empty selects (?map=&mode=…), which must not deindex the page.
	const { cursor: _, ...applied } = discovery.filters;

	return {
		...discovery,
		nextHref: discovery.nextCursor ? `${nextUrl.pathname}${nextUrl.search}` : null,
		canonical: canonicalUrl(url, '/strategies'),
		filtered: Object.values(applied).some((value) => value !== null)
	};
};
