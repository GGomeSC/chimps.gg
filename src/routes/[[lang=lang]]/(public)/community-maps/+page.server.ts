import { fail, redirect } from '@sveltejs/kit';
import { localizeHref, pathnameLocale } from '$lib/i18n';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const code = String((await request.formData()).get('code') ?? '').trim().toUpperCase();
		if (!/^[A-Z0-9]{6,12}$/.test(code)) return fail(400, { error: 'Enter a valid map share code.' });
		redirect(303, localizeHref(`/community-maps/${code}`, pathnameLocale(url.pathname)));
	}
};
