import { getLocale } from '$lib/paraglide/runtime';
import { DEFAULT_LOCALE, isLocale, localizeHref } from '$lib/i18n';

/** Localize an internal href to the locale of the page being rendered. */
export function href(path: string): string {
	const locale = getLocale();
	return localizeHref(path, isLocale(locale) ? locale : DEFAULT_LOCALE);
}
