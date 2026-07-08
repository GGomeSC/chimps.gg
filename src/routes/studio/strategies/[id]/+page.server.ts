import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { isHeroTower, PATH_PATTERN } from '$lib/server/placements';
import { parseStrategyForm } from '$lib/server/strategy-form';
import { TOWER_ICON_BUCKET, type TowerWithIcon } from '$lib/tower-icons';
import type { StepAction, StepInsert, TowerRow } from '$lib/types/db';
import type { Actions, PageServerLoad } from './$types';

const STEP_ACTIONS: readonly StepAction[] = ['place', 'upgrade', 'sell', 'retarget', 'other'];

type StepFormResult = { ok: true; data: Omit<StepInsert, 'strategy_id' | 'order_index'> } | { ok: false; error: string };

async function parseStepForm(form: FormData, strategyId: number): Promise<StepFormResult> {
	const roundNumber = Number(form.get('round_number'));
	if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 200) {
		return { ok: false, error: 'Round must be between 1 and 200' };
	}

	const action = String(form.get('action') ?? '') as StepAction;
	if (!STEP_ACTIONS.includes(action)) return { ok: false, error: 'Invalid action' };

	const placementRaw = String(form.get('placement_id') ?? '').trim();
	const placementId = placementRaw ? Number(placementRaw) : null;
	let placementTowerId: number | null = null;
	if (placementId !== null && (!Number.isInteger(placementId) || placementId < 1)) {
		return { ok: false, error: 'Invalid placement' };
	}
	if (placementId !== null) {
		const { data: placement } = await supabase
			.from('placements')
			.select('id, tower_id')
			.eq('id', placementId)
			.eq('strategy_id', strategyId)
			.maybeSingle();
		if (!placement) return { ok: false, error: 'Placement does not belong to this strategy' };
		placementTowerId = placement.tower_id;
	}

	const targetRaw = String(form.get('target_path') ?? '').trim();
	if (targetRaw && !PATH_PATTERN.test(targetRaw)) {
		return { ok: false, error: 'Target path must match 0-0-0 … 5-5-5' };
	}
	if (targetRaw && placementTowerId !== null && (await isHeroTower(placementTowerId))) {
		return { ok: false, error: 'Hero steps do not use target paths' };
	}

	const descriptionRaw = String(form.get('description') ?? '').trim();
	// Keys are DB columns (snake_case); locals are camelCase.
	return {
		ok: true,
		data: {
			round_number: roundNumber,
			action,
			placement_id: placementId,
			target_path: targetRaw || null,
			description: descriptionRaw || null
		}
	};
}

function strategyId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(404, 'Not found');
	return id;
}

function withTowerIconUrl(tower: TowerRow): TowerWithIcon {
	const { data } = supabase.storage.from(TOWER_ICON_BUCKET).getPublicUrl(tower.icon_path);
	return { ...tower, icon_url: data.publicUrl };
}

export const load: PageServerLoad = async ({ params }) => {
	const id = strategyId(params);

	const [strategy, maps, modes, towers, placements, steps] = await Promise.all([
		supabase.from('strategies').select('*').eq('id', id).maybeSingle(),
		supabase.from('maps').select('id, name, difficulty, image_url, nk_image_url').order('name'),
		supabase.from('game_modes').select('id, name').order('id'),
		supabase.from('towers').select('*').order('name'),
		supabase.from('placements').select('*').eq('strategy_id', id).order('id'),
		supabase.from('steps').select('*').eq('strategy_id', id).order('order_index')
	]);
	const firstError = [strategy, maps, modes, towers, placements, steps].find((r) => r.error);
	if (firstError?.error) error(500, firstError.error.message);
	if (!strategy.data) error(404, 'Strategy not found');

	return {
		strategy: strategy.data,
		maps: maps.data!,
		modes: modes.data!,
		towers: towers.data!.map(withTowerIconUrl),
		placements: placements.data!,
		steps: steps.data!
	};
};

export const actions: Actions = {
	updateMeta: async ({ params, request }) => {
		const id = strategyId(params);
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

		const { error: dbError } = await supabase.from('strategies').update(parsed.data).eq('id', id);
		if (dbError) return fail(500, { error: dbError.message });
		return { saved: true };
	},

	addStep: async ({ params, request }) => {
		const id = strategyId(params);
		const parsed = await parseStepForm(await request.formData(), id);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const { data: last } = await supabase
			.from('steps')
			.select('order_index')
			.eq('strategy_id', id)
			.order('order_index', { ascending: false })
			.limit(1)
			.maybeSingle();

		const { error: dbError } = await supabase
			.from('steps')
			.insert({ ...parsed.data, strategy_id: id, order_index: (last?.order_index ?? 0) + 1 });
		if (dbError) return fail(500, { error: dbError.message });
		return { saved: true };
	},

	updateStep: async ({ params, request }) => {
		const id = strategyId(params);
		const form = await request.formData();
		const stepId = Number(form.get('step_id'));
		if (!Number.isInteger(stepId) || stepId < 1) return fail(400, { error: 'Invalid step' });

		const parsed = await parseStepForm(form, id);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const { error: dbError } = await supabase
			.from('steps')
			.update(parsed.data)
			.eq('id', stepId)
			.eq('strategy_id', id);
		if (dbError) return fail(500, { error: dbError.message });
		return { saved: true };
	},

	deleteStep: async ({ params, request }) => {
		const id = strategyId(params);
		const stepId = Number((await request.formData()).get('step_id'));
		if (!Number.isInteger(stepId) || stepId < 1) return fail(400, { error: 'Invalid step' });

		const { error: dbError } = await supabase
			.from('steps')
			.delete()
			.eq('id', stepId)
			.eq('strategy_id', id);
		if (dbError) return fail(500, { error: dbError.message });
		return { saved: true };
	},

	moveStep: async ({ params, request }) => {
		const id = strategyId(params);
		const form = await request.formData();
		const stepId = Number(form.get('step_id'));
		const direction = String(form.get('direction'));
		if (!Number.isInteger(stepId) || (direction !== 'up' && direction !== 'down')) {
			return fail(400, { error: 'Invalid move' });
		}

		const { data: steps, error: listError } = await supabase
			.from('steps')
			.select('id')
			.eq('strategy_id', id)
			.order('order_index');
		if (listError) return fail(500, { error: listError.message });

		const ids = steps.map((s) => s.id);
		const from = ids.indexOf(stepId);
		const to = direction === 'up' ? from - 1 : from + 1;
		if (from === -1 || to < 0 || to >= ids.length) return { saved: true };
		[ids[from], ids[to]] = [ids[to], ids[from]];

		const { error: rpcError } = await supabase.rpc('reorder_steps', {
			p_strategy_id: id,
			p_step_ids: ids
		});
		if (rpcError) return fail(500, { error: rpcError.message });
		return { saved: true };
	}
};
