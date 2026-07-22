import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'chimps-player';
const MAX_AGE = 60 * 60 * 24 * 30;

function signature(value: string): string {
	const secret = env.INTERNAL_SERVICE_SECRET;
	if (!secret) throw new Error('INTERNAL_SERVICE_SECRET is required');
	return createHmac('sha256', secret).update(value).digest('base64url');
}

export function setPlayerSession(cookies: Cookies, userId: string, secure: boolean): void {
	const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
	const payload = Buffer.from(JSON.stringify({ userId, expires })).toString('base64url');
	cookies.set(COOKIE, `${payload}.${signature(payload)}`, {
		path: '/', httpOnly: true, secure, sameSite: 'lax', maxAge: MAX_AGE
	});
}

export function getPlayerSession(cookies: Cookies): string | null {
	const raw = cookies.get(COOKIE);
	if (!raw) return null;
	const [payload, supplied, extra] = raw.split('.');
	if (!payload || !supplied || extra) return null;
	const expected = signature(payload);
	const a = Buffer.from(supplied); const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { userId?: unknown; expires?: unknown };
		return typeof parsed.userId === 'string' && typeof parsed.expires === 'number' && parsed.expires > Date.now() / 1000
			? parsed.userId : null;
	} catch { return null; }
}
