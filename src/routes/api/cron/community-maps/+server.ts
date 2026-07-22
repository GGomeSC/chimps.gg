import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createAnalyticsApi, chimpsErrorMessage } from '$lib/server/chimps-client';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

export const config: Config = { maxDuration: 300 };

export const GET: RequestHandler = async ({ request, fetch, url }) => {
	const expected = env.CRON_SECRET;
	if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}
	try {
		return json(await createAnalyticsApi(fetch, url.origin).syncCommunityMaps(), {
			headers: { 'cache-control': 'no-store' }
		});
	} catch (cause) {
		return json({ error: chimpsErrorMessage(cause, 'Community map sync failed.') }, { status: 502 });
	}
};
