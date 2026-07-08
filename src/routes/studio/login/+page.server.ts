import { fail, redirect } from '@sveltejs/kit';
import {
	isStudioEmailAllowed,
	normalizeEmail,
	sanitizeStudioRedirect
} from '$lib/server/studio-auth';
import type { Actions, PageServerLoad } from './$types';

type LoginError = 'invalid_link' | 'not_allowed' | null;

export const load: PageServerLoad = async ({ locals, url }) => {
	const redirectTo = sanitizeStudioRedirect(url.searchParams.get('redirectTo'));
	if (locals.studioUser) redirect(303, redirectTo);

	return {
		redirectTo,
		error: loginError(url.searchParams.get('error'))
	};
};

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		const form = await request.formData();
		const email = normalizeEmail(form.get('email'));
		const redirectTo = sanitizeStudioRedirect(form.get('redirectTo'));

		if (!email) {
			return fail(400, { error: 'Enter an email address.', email, redirectTo });
		}
		if (!isStudioEmailAllowed(email)) {
			return fail(403, { error: 'This email is not allowed to access the studio.', email, redirectTo });
		}

		const emailRedirectTo = `${url.origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`;
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo,
				shouldCreateUser: false
			}
		});

		if (error) {
			return fail(400, {
				error: 'Could not send the magic link. Confirm this user exists in Supabase Auth.',
				email,
				redirectTo
			});
		}

		return { sent: true, email, redirectTo };
	}
};

function loginError(value: string | null): LoginError {
	return value === 'invalid_link' || value === 'not_allowed' ? value : null;
}
