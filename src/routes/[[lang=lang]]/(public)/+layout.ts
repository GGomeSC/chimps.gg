import { browser } from '$app/environment';
import { DEFAULT_LOCALE, isLocale, type Locale } from '$lib/i18n';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { LayoutLoad } from './$types';

// On the client the locale comes from the route param, mirroring the
// server-side AsyncLocalStorage wiring in hooks.server.ts. Cross-locale
// navigation only happens through the language switcher, which does a full
// page load, so a module-level variable is enough.
let clientLocale: Locale = DEFAULT_LOCALE;
if (browser) overwriteGetLocale(() => clientLocale);

export const load: LayoutLoad = ({ params, data }) => {
	const locale: Locale = isLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
	if (browser) clientLocale = locale;
	return { ...data, locale };
};
