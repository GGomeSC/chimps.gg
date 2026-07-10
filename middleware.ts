// Vercel Routing Middleware: per-visitor locale redirects. Runs before the
// CDN/ISR cache, so redirects are never cached into a page response. The URL
// stays the only source of truth for rendering — this only picks the URL.
import { next } from '@vercel/functions';
import {
	LOCALE_COOKIE,
	LOCALE_COOKIE_MAX_AGE,
	PT_COUNTRIES,
	SUPPORTED_URL_LANGS
} from './src/lib/i18n';

export const config = {
	// Skip /studio, /auth, SvelteKit assets, and anything with a file extension
	// (robots.txt, sitemap.xml, favicon.png, __data.json, /_app/* chunks).
	matcher: '/((?!studio|auth|_app/|.*\\..*).*)'
};

const BOT_RE = /bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|preview/i;

export default function middleware(request: Request): Response {
	if (request.method !== 'GET') return next();

	const url = new URL(request.url);
	// Prefixed URLs are explicit — never redirect them, even with cookie "en".
	for (const lang of SUPPORTED_URL_LANGS) {
		if (url.pathname === `/${lang}` || url.pathname.startsWith(`/${lang}/`)) return next();
	}

	// Crawlers discover /pt/* through hreflang and the sitemap instead.
	if (BOT_RE.test(request.headers.get('user-agent') ?? '')) return next();

	const preference = cookieValue(request.headers.get('cookie'), LOCALE_COOKIE);
	if (preference === 'en') return next();

	let redirectToPt = preference === 'pt';
	let setCookie = false;
	if (!preference) {
		const country = request.headers.get('x-vercel-ip-country');
		redirectToPt = country
			? PT_COUNTRIES.has(country)
			: prefersPortuguese(request.headers.get('accept-language'));
		setCookie = redirectToPt;
	}
	if (!redirectToPt) return next();

	const target = new URL(`/pt${url.pathname === '/' ? '' : url.pathname}${url.search}`, url);
	const headers = new Headers({ location: target.toString() });
	if (setCookie) {
		headers.append(
			'set-cookie',
			`${LOCALE_COOKIE}=pt; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
		);
	}
	// Always 302: the decision is per-visitor, never permanent.
	return new Response(null, { status: 302, headers });
}

function cookieValue(header: string | null, name: string): string | null {
	if (!header) return null;
	for (const part of header.split(';')) {
		const [key, ...rest] = part.trim().split('=');
		if (key === name) return rest.join('=');
	}
	return null;
}

function prefersPortuguese(header: string | null): boolean {
	if (!header) return false;
	const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
	return first.startsWith('pt');
}
