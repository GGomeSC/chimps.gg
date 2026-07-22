import { fail, redirect } from '@sveltejs/kit';
import { createAnalyticsApi, createPublicApi, chimpsErrorMessage } from '$lib/server/chimps-client';
import { setPlayerSession } from '$lib/server/player-session';
import { localizeHref, pathnameLocale } from '$lib/i18n';
import type { Actions, PageServerLoad } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

export const config: Config = { isr: false };

export const load: PageServerLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	let players: Awaited<ReturnType<ReturnType<typeof createPublicApi>['searchPlayers']>>['players'] = [];
	if (q) players = (await createPublicApi(fetch, url.origin).searchPlayers(q)).players;
	return { q, players };
};

export const actions: Actions = {
	oak: async ({ request, fetch, url, cookies }) => {
		const oak = String((await request.formData()).get('oak') ?? '').trim();
		if (!oak) return fail(400, { action: 'oak', error: 'Enter your OAK.' });
		try {
			const { userId } = await createAnalyticsApi(fetch, url.origin).resolveOwnPlayer(oak);
			setPlayerSession(cookies, userId, url.protocol === 'https:');
			redirect(303, localizeHref(`/players/${encodeURIComponent(userId)}`, pathnameLocale(url.pathname)));
		} catch (cause) {
			return fail(400, { action: 'oak', error: chimpsErrorMessage(cause, 'The OAK could not be verified.') });
		}
	},
	resolve: async ({ request, fetch, url }) => {
		const identifier = String((await request.formData()).get('identifier') ?? '').trim();
		if (!identifier) return fail(400, { action: 'resolve', error: 'Enter a profile URL or user ID.' });
		try {
			const player = await createAnalyticsApi(fetch, url.origin).resolvePlayer(identifier);
			redirect(303, localizeHref(`/players/${encodeURIComponent(player.userId)}`, pathnameLocale(url.pathname)));
		} catch (cause) {
			return fail(400, { action: 'resolve', error: chimpsErrorMessage(cause, 'Player not found.') });
		}
	}
};
