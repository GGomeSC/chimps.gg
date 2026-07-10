import type { Config } from '@sveltejs/adapter-vercel';
import { SUPPORTED_LOCALES, delocalizePath, localizeHref } from '$lib/i18n';
import { canonicalUrl } from '$lib/server/public-content';
import type { LayoutServerLoad } from './$types';

export const config: Config = {
	isr: {
		expiration: 300
	}
};

export const load: LayoutServerLoad = ({ url }) => {
	const path = delocalizePath(url.pathname);
	return {
		// hreflang alternates for every locale; x-default is the unprefixed URL.
		alternates: SUPPORTED_LOCALES.map((locale) => ({
			locale,
			href: canonicalUrl(url, localizeHref(path, locale))
		})),
		xDefault: canonicalUrl(url, path)
	};
};
