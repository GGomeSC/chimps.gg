import type { ParamMatcher } from '@sveltejs/kit';
import { SUPPORTED_URL_LANGS } from '$lib/i18n';

export const match: ParamMatcher = (value) =>
	(SUPPORTED_URL_LANGS as readonly string[]).includes(value);
