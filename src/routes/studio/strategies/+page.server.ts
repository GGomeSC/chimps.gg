import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [strategies, maps, modes, heroes, placements] = await Promise.all([
		supabase.from('strategies').select('*').order('updated_at', { ascending: false }),
		supabase.from('maps').select('id, name'),
		supabase.from('game_modes').select('id, name'),
		supabase.from('towers').select('id, name').eq('category', 'Hero'),
		supabase.from('placements').select('strategy_id')
	]);
	const firstError = [strategies, maps, modes, heroes, placements].find((r) => r.error);
	if (firstError?.error) error(500, firstError.error.message);

	const mapNames = new Map(maps.data!.map((m) => [m.id, m.name]));
	const modeNames = new Map(modes.data!.map((m) => [m.id, m.name]));
	const heroNames = new Map(heroes.data!.map((h) => [h.id, h.name]));
	const placementCounts = new Map<number, number>();
	for (const p of placements.data!) {
		placementCounts.set(p.strategy_id, (placementCounts.get(p.strategy_id) ?? 0) + 1);
	}

	return {
		strategies: strategies.data!.map((s) => ({
			...s,
			map_name: mapNames.get(s.map_id) ?? '?',
			mode_name: modeNames.get(s.game_mode_id) ?? '?',
			hero_name: s.hero_id ? (heroNames.get(s.hero_id) ?? '?') : null,
			placement_count: placementCounts.get(s.id) ?? 0
		}))
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id) || id < 1) return fail(400, { error: 'Invalid strategy id' });

		// Cascades to placements and steps.
		const { error: dbError } = await supabase.from('strategies').delete().eq('id', id);
		if (dbError) return fail(500, { error: dbError.message });
		return { success: true };
	}
};
