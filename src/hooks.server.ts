import { AsyncLocalStorage } from 'node:async_hooks';
import { createServerClient } from '@supabase/ssr';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { DEFAULT_LOCALE, pathnameLocale, type Locale } from '$lib/i18n';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { isStudioEmailAllowed, sanitizeStudioRedirect } from '$lib/server/studio-auth';
import type { Database } from '$lib/types/db';

// The URL is the only source of truth for the rendering locale (ISR caches one
// response per URL). AsyncLocalStorage keeps concurrent requests isolated.
const localeStorage = new AsyncLocalStorage<Locale>();
overwriteGetLocale(() => localeStorage.getStore() ?? DEFAULT_LOCALE);

type StudioClaims = {
	sub?: string;
	email?: string;
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.studioUser = null;
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			global: {
				fetch: event.fetch
			},
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet, headersToSet) => {
					for (const { name, value, options } of cookiesToSet) {
						event.cookies.set(name, value, { ...options, path: '/' });
					}
					if (Object.keys(headersToSet).length > 0) {
						event.setHeaders(headersToSet);
					}
				}
			}
		}
	);

	const pathname = event.url.pathname;
	const routePath = pageRoutePath(pathname);
	if (isStudioPath(routePath)) {
		let claims: StudioClaims | null = null;
		if (isStudioAuthBypassed()) {
			event.locals.studioUser = { id: 'local-development', email: 'dev@localhost' };
		} else {
			claims = await verifiedClaims(event.locals.supabase);
			if (claims?.sub && claims.email && isStudioEmailAllowed(claims.email)) {
				event.locals.studioUser = { id: claims.sub, email: claims.email };
			}
		}

		if (!isPublicStudioPath(routePath, event.request.method) && !event.locals.studioUser) {
			if (claims?.email && !isStudioEmailAllowed(claims.email)) {
				if (isPageRequest(event.request, pathname)) {
					await event.locals.supabase.auth.signOut();
					redirect(303, '/studio/login?error=not_allowed');
				}
				error(403, 'Forbidden');
			}

			if (isPageRequest(event.request, pathname)) {
				redirect(303, `/studio/login?redirectTo=${encodeURIComponent(sanitizeStudioRedirect(routePath))}`);
			}
			error(401, 'Unauthorized');
		}
	}

	const locale = pathnameLocale(pathname);
	return localeStorage.run(locale, () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', locale),
			filterSerializedResponseHeaders(name) {
				return name === 'content-range' || name === 'x-supabase-api-version';
			}
		})
	);
};

async function verifiedClaims(
	supabase: App.Locals['supabase']
): Promise<StudioClaims | null> {
	const { data, error: claimsError } = await supabase.auth.getClaims();
	if (claimsError) return null;
	return (data?.claims ?? null) as StudioClaims | null;
}

function isStudioPath(pathname: string): boolean {
	return pathname === '/studio' || pathname.startsWith('/studio/');
}

function isStudioAuthBypassed(): boolean {
	return dev && env.STUDIO_AUTH_BYPASS === 'true';
}

function isPublicStudioPath(pathname: string, method: string): boolean {
	return pathname === '/studio/login' || (pathname === '/studio/logout' && method === 'POST');
}

function isPageRequest(request: Request, pathname: string): boolean {
	return (
		request.method === 'GET' &&
		((request.headers.get('accept') ?? '').includes('text/html') ||
			pathname.endsWith('/__data.json') ||
			request.headers.has('x-sveltekit-invalidated'))
	);
}

function pageRoutePath(pathname: string): string {
	const dataSuffix = '/__data.json';
	return pathname.endsWith(dataSuffix) ? pathname.slice(0, -dataSuffix.length) : pathname;
}
