import { error } from '@sveltejs/kit';
import { createPublicApi, chimpsErrorCode } from '$lib/server/chimps-client';
import { getPlayerSession } from '$lib/server/player-session';
import type { PageServerLoad } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';

// Ownership comes from a signed cookie and must never be captured in ISR.
export const config: Config = { isr: false };

export const load: PageServerLoad = async ({ params, fetch, url, cookies }) => {
	try {
		const player = await createPublicApi(fetch, url.origin).getPlayer(params.id);
		return { player, isOwn: getPlayerSession(cookies) === player.userId };
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'player_not_found') error(404, 'Player not found');
		error(502, 'Player profile unavailable');
	}
};
