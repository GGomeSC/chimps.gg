import { error, fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { parseStrategyForm } from '$lib/server/strategy-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [maps, modes, heroes] = await Promise.all([
		supabase.from('maps').select('id, name, difficulty').order('name'),
		supabase.from('game_modes').select('id, name').order('id'),
		supabase.from('towers').select('id, name').eq('category', 'Hero').order('name')
	]);
	const firstError = [maps, modes, heroes].find((r) => r.error);
	if (firstError?.error) error(500, firstError.error.message);

	return { maps: maps.data!, modes: modes.data!, heroes: heroes.data! };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const parsed = parseStrategyForm(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });

		if (parsed.data.hero_id) {
			const { data: hero } = await supabase
				.from('towers')
				.select('category')
				.eq('id', parsed.data.hero_id)
				.single();
			if (hero?.category !== 'Hero') return fail(400, { error: 'hero_id must be a Hero tower' });
		}

		const { data: created, error: dbError } = await supabase
			.from('strategies')
			.insert(parsed.data)
			.select('id')
			.single();
		if (dbError) return fail(500, { error: dbError.message });

		redirect(303, `/studio/strategies/${created.id}`);
	}
};
