import { canonicalUrl, getSitemapEntries } from '$lib/server/public-content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const entries = await getSitemapEntries();
	const paths = [
		'/',
		'/strategies',
		'/heroes',
		...entries.strategyIds.map((id) => `/strategies/${id}`),
		...entries.heroIds.map((id) => `/heroes/${id}`)
	];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${canonicalUrl(url, path)}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
