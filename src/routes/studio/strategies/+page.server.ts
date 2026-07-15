import { error, fail } from '@sveltejs/kit';
import { chimpsErrorMessage, createStudioApi } from '$lib/server/chimps-client';
import type { Actions, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		return await createStudioApi(fetch, url.origin).getStrategies();
	} catch (cause) {
		error(500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};

export const actions: Actions = {
	delete: async ({ request, fetch, url }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id) || id < 1) return fail(400, { error: 'Invalid strategy id' });

		try {
			return await createStudioApi(fetch, url.origin).deleteStrategy(id);
		} catch (cause) {
			return fail(500, { error: chimpsErrorMessage(cause, 'Database operation failed.') });
		}
	}
};
