import { error } from '@sveltejs/kit';
import { chimpsErrorMessage, createStudioApi } from '$lib/server/chimps-client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		return await createStudioApi(fetch, url.origin).getMaps();
	} catch (cause) {
		error(500, `Failed to load maps: ${chimpsErrorMessage(cause, 'Unknown error')}`);
	}
};
