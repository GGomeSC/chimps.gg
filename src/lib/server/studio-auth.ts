import { env } from '$env/dynamic/private';

const DEFAULT_STUDIO_REDIRECT = '/studio/strategies';

export function normalizeEmail(value: unknown): string {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isStudioEmailAllowed(email: unknown): boolean {
	const normalized = normalizeEmail(email);
	if (!normalized) return false;
	return allowedStudioEmails().has(normalized);
}

export function sanitizeStudioRedirect(value: unknown): string {
	if (typeof value !== 'string') return DEFAULT_STUDIO_REDIRECT;

	const trimmed = value.trim();
	if (!trimmed.startsWith('/studio') || trimmed.startsWith('//')) return DEFAULT_STUDIO_REDIRECT;

	const path = trimmed.split(/[?#]/, 1)[0];
	if (path === '/studio' || path.startsWith('/studio/')) {
		if (path === '/studio/login' || path === '/studio/logout') return DEFAULT_STUDIO_REDIRECT;
		return path;
	}

	return DEFAULT_STUDIO_REDIRECT;
}

function allowedStudioEmails(): Set<string> {
	return new Set(
		(env.STUDIO_ALLOWED_EMAILS ?? '')
			.split(/[,\s]+/)
			.map(normalizeEmail)
			.filter(Boolean)
	);
}
