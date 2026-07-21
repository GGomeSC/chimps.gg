import { localizeHref, pathnameLocale } from '$lib/i18n';
import { canonicalUrl, discoverStrategies } from '$lib/server/public-content';
import type { Config } from '@sveltejs/adapter-vercel';
import type { PageServerLoad } from './$types';

export const config: Config = {
	isr: {
		expiration: 180,
		allowQuery: ['q', 'map', 'mode', 'hero', 'difficulty', 'mapDifficulty', 'version', 'cursor']
	}
};

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
	const discovery = await discoverStrategies(fetch, url);
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
		canonical: canonicalUrl(url, localizeHref('/strategies', pathnameLocale(url.pathname))),
		filtered:
			Object.values(applied).some((value) => value !== null) ||
			Boolean(url.searchParams.get('q')?.trim()),
		query: url.searchParams.get('q')?.trim() ?? ''
	};
};
