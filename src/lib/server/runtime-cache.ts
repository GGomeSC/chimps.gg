import { getCache } from '@vercel/functions';

type CacheOptions = {
	ttl: number;
	tags: string[];
	name: string;
};

const cache = getCache({ namespace: 'chimps-public-v1' });
const inFlight = new Map<string, Promise<unknown>>();

export async function withRuntimeCache<T>(
	key: string,
	load: () => Promise<T>,
	options: CacheOptions
): Promise<T> {
	const active = inFlight.get(key) as Promise<T> | undefined;
	if (active) return active;

	const pending = (async () => {
		const cached = await cache.get(key);
		if (cached !== null) return cached as T;

		const value = await load();
		await cache.set(key, value, options);
		return value;
	})();

	inFlight.set(key, pending);
	try {
		return await pending;
	} finally {
		if (inFlight.get(key) === pending) inFlight.delete(key);
	}
}
