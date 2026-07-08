import { createServerClient } from '@supabase/ssr';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { isStudioEmailAllowed, sanitizeStudioRedirect } from '$lib/server/studio-auth';
import type { Database } from '$lib/types/db';

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
		const claims = await verifiedClaims(event.locals.supabase);
		if (claims?.sub && claims.email && isStudioEmailAllowed(claims.email)) {
			event.locals.studioUser = { id: claims.sub, email: claims.email };
		}

		if (!isPublicStudioPath(routePath, event.request.method) && !event.locals.studioUser) {
			if (claims?.email && !isStudioEmailAllowed(claims.email)) {
				if (isPageRequest(event.request)) {
					await event.locals.supabase.auth.signOut();
					redirect(303, '/studio/login?error=not_allowed');
				}
				error(403, 'Forbidden');
			}

			if (isPageRequest(event.request)) {
				redirect(303, `/studio/login?redirectTo=${encodeURIComponent(sanitizeStudioRedirect(routePath))}`);
			}
			error(401, 'Unauthorized');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
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

function isPublicStudioPath(pathname: string, method: string): boolean {
	return pathname === '/studio/login' || (pathname === '/studio/logout' && method === 'POST');
}

function isPageRequest(request: Request): boolean {
	return request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html');
}

function pageRoutePath(pathname: string): string {
	const dataSuffix = '/__data.json';
	return pathname.endsWith(dataSuffix) ? pathname.slice(0, -dataSuffix.length) : pathname;
}
