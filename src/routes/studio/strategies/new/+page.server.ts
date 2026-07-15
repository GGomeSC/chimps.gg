import { error, fail, redirect } from '@sveltejs/kit';
import { chimpsErrorMessage, createStudioApi } from '$lib/server/chimps-client';
import { parseStrategyForm } from '$lib/server/strategy-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		return await createStudioApi(fetch, url.origin).getStrategyReferences();
	} catch (cause) {
		error(500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};

export const actions: Actions = {
	default: async ({ request, fetch, url }) => {
		const parsed = parseStrategyForm(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });

		let created: { id: number };
		try {
			created = await createStudioApi(fetch, url.origin).createStrategy({
				map_id: parsed.data.map_id,
				game_mode_id: parsed.data.game_mode_id,
				title: parsed.data.title,
				description: parsed.data.description ?? null,
				hero_id: parsed.data.hero_id ?? null,
				source_url: parsed.data.source_url ?? null,
				verified_version: parsed.data.verified_version ?? null,
				exec_difficulty: parsed.data.exec_difficulty ?? null,
				status: parsed.data.status ?? 'draft'
			});
		} catch (cause) {
			const status =
				typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'invalid_hero'
					? 400
					: 500;
			return fail(status, { error: chimpsErrorMessage(cause, 'Database operation failed.') });
		}
		redirect(303, `/studio/strategies/${created.id}`);
	}
};
