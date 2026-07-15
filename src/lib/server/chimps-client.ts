import { env } from '$env/dynamic/private';
import { createClient } from './generated/chimps/client/client.gen';

export function createChimpsClient(fetcher: typeof fetch, origin: string) {
	const internalServiceSecret = env.INTERNAL_SERVICE_SECRET;
	if (!internalServiceSecret) {
		throw new Error('INTERNAL_SERVICE_SECRET is not configured.');
	}

	return createClient({
		baseUrl: `${origin}/api/chimps`,
		fetch: fetcher,
		headers: {
			Authorization: `Bearer ${internalServiceSecret}`
		},
		responseStyle: 'data',
		throwOnError: true
	});
}
