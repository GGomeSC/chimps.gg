import { SUPPORTED_LOCALES, localizeHref } from '$lib/i18n';
import { canonicalUrl, getSitemapEntries } from '$lib/server/public-content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
	const entries = await getSitemapEntries(fetch, url.origin);
	const paths = [
		'/',
		'/maps',
		'/community-maps',
		'/players',
		'/strategies',
		'/heroes',
		...entries.strategyIds.map((id) => `/strategies/${id}`),
		...entries.heroIds.map((id) => `/heroes/${id}`)
	];
	const alternates = (path: string) =>
		SUPPORTED_LOCALES.map(
			(locale) =>
				`    <xhtml:link rel="alternate" hreflang="${locale}" href="${canonicalUrl(url, localizeHref(path, locale))}"/>`
		).join('\n');
	const urls = paths.flatMap((path) =>
		SUPPORTED_LOCALES.map(
			(locale) =>
				`  <url>\n    <loc>${canonicalUrl(url, localizeHref(path, locale))}</loc>\n${alternates(path)}\n  </url>`
		)
	);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
