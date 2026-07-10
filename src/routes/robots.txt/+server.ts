import { canonicalUrl } from '$lib/server/public-content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /studio
Disallow: /auth

Sitemap: ${canonicalUrl(url, '/sitemap.xml')}
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
		}
	});
};
