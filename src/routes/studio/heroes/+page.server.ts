import { error } from '@sveltejs/kit';
import { chimpsErrorMessage, createStudioApi } from '$lib/server/chimps-client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		return await createStudioApi(fetch, url.origin).getHeroes();
	} catch (cause) {
		error(500, `Failed to load heroes: ${chimpsErrorMessage(cause, 'Unknown error')}`);
	}
};
