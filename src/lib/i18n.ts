// Single source of truth for locales. Everything that enumerates languages —
// the route matcher, the detection middleware, hreflang, the sitemap, and the
// language switcher — reads from this module. It must stay dependency-free:
// the root middleware.ts imports it outside the SvelteKit build.

export const SUPPORTED_LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Locales that appear as a URL prefix (the default locale stays unprefixed). */
export const SUPPORTED_URL_LANGS = SUPPORTED_LOCALES.filter(
	(locale) => locale !== DEFAULT_LOCALE
);

export const LOCALE_COOKIE = 'chimps-locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Countries whose visitors default to Portuguese (Lusophone world). */
export const PT_COUNTRIES = new Set([
	'BR',
	'PT',
	'AO',
	'MZ',
	'CV',
	'GW',
	'ST',
	'TL',
	'GQ',
	'MO'
]);

export function isLocale(value: string | undefined | null): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '');
}

/** The locale a pathname renders in. The URL is the only source of truth. */
export function pathnameLocale(pathname: string): Locale {
	for (const lang of SUPPORTED_URL_LANGS) {
		if (pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)) return lang;
	}
	return DEFAULT_LOCALE;
}

/** Strip a locale prefix, returning the unprefixed (English) path. */
export function delocalizePath(pathname: string): string {
	for (const lang of SUPPORTED_URL_LANGS) {
		if (pathname === `/${lang}`) return '/';
		if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1);
	}
	return pathname;
}

/** Prefix an unprefixed internal path for the given locale. */
export function localizeHref(path: string, locale: Locale): string {
	if (locale === DEFAULT_LOCALE) return path;
	return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
