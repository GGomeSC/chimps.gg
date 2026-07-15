import { AsyncLocalStorage } from 'node:async_hooks';
import type { Handle } from '@sveltejs/kit';
import { DEFAULT_LOCALE, pathnameLocale, type Locale } from '$lib/i18n';
import { overwriteGetLocale } from '$lib/paraglide/runtime';

// The URL is the only source of truth for the rendering locale (ISR caches one
// response per URL). AsyncLocalStorage keeps concurrent requests isolated.
const localeStorage = new AsyncLocalStorage<Locale>();
overwriteGetLocale(() => localeStorage.getStore() ?? DEFAULT_LOCALE);

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
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
