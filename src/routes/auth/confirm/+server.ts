import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import { isStudioEmailAllowed, normalizeEmail, sanitizeStudioRedirect } from '$lib/server/studio-auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const tokenHash = url.searchParams.get('token_hash');
	const type = otpType(url.searchParams.get('type'));
	const next = sanitizeStudioRedirect(url.searchParams.get('next'));

	if (!tokenHash || !type) {
		redirect(303, '/studio/login?error=invalid_link');
	}

	const { data, error } = await locals.supabase.auth.verifyOtp({
		token_hash: tokenHash,
		type
	});
	if (error) {
		redirect(303, '/studio/login?error=invalid_link');
	}

	const email = normalizeEmail(data.user?.email);
	if (!isStudioEmailAllowed(email)) {
		await locals.supabase.auth.signOut();
		redirect(303, '/studio/login?error=not_allowed');
	}

	redirect(303, next);
};

function otpType(value: string | null): EmailOtpType | null {
	return value === 'email' || value === 'magiclink' ? value : null;
}
