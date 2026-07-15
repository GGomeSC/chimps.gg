import { error, fail } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createStudioApi
} from '$lib/server/chimps-client';
import { PATH_PATTERN } from '$lib/server/placements';
import { parseStrategyForm } from '$lib/server/strategy-form';
import type { StepAction, StepInsert } from '$lib/types/db';
import type { Actions, PageServerLoad } from './$types';

const STEP_ACTIONS: readonly StepAction[] = ['place', 'upgrade', 'sell', 'retarget', 'other'];

type StepFormResult =
	| { ok: true; data: Omit<StepInsert, 'strategy_id' | 'order_index'> }
	| { ok: false; error: string };

function parseStepForm(form: FormData): StepFormResult {
	const roundNumber = Number(form.get('round_number'));
	if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 200) {
		return { ok: false, error: 'Round must be between 1 and 200' };
	}

	const action = String(form.get('action') ?? '') as StepAction;
	if (!STEP_ACTIONS.includes(action)) return { ok: false, error: 'Invalid action' };

	const placementRaw = String(form.get('placement_id') ?? '').trim();
	const placementId = placementRaw ? Number(placementRaw) : null;
	if (placementId !== null && (!Number.isInteger(placementId) || placementId < 1)) {
		return { ok: false, error: 'Invalid placement' };
	}

	const targetRaw = String(form.get('target_path') ?? '').trim();
	if (targetRaw && !PATH_PATTERN.test(targetRaw)) {
		return { ok: false, error: 'Target path must match 0-0-0 … 5-5-5' };
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

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const id = strategyId(params);
	try {
		return await createStudioApi(fetch, url.origin).getStrategy(id);
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'strategy_not_found') error(404, 'Strategy not found');
		error(500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};

export const actions: Actions = {
	updateMeta: async ({ params, request, fetch, url }) => {
		const id = strategyId(params);
		const parsed = parseStrategyForm(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });

		try {
			return await createStudioApi(fetch, url.origin).updateStrategy(id, {
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
			return studioActionFailure(cause);
		}
	},

	addStep: async ({ params, request, fetch, url }) => {
		const id = strategyId(params);
		const parsed = parseStepForm(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });

		try {
			return await createStudioApi(fetch, url.origin).createStep(id, {
				round_number: parsed.data.round_number,
				action: parsed.data.action,
				placement_id: parsed.data.placement_id ?? null,
				target_path: parsed.data.target_path ?? null,
				description: parsed.data.description ?? null
			});
		} catch (cause) {
			return studioActionFailure(cause);
		}
	},

	updateStep: async ({ params, request, fetch, url }) => {
		const id = strategyId(params);
		const form = await request.formData();
		const stepId = Number(form.get('step_id'));
		if (!Number.isInteger(stepId) || stepId < 1) return fail(400, { error: 'Invalid step' });

		const parsed = parseStepForm(form);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		try {
			return await createStudioApi(fetch, url.origin).updateStep(id, stepId, {
				round_number: parsed.data.round_number,
				action: parsed.data.action,
				placement_id: parsed.data.placement_id ?? null,
				target_path: parsed.data.target_path ?? null,
				description: parsed.data.description ?? null
			});
		} catch (cause) {
			return studioActionFailure(cause);
		}
	},

	deleteStep: async ({ params, request, fetch, url }) => {
		const id = strategyId(params);
		const stepId = Number((await request.formData()).get('step_id'));
		if (!Number.isInteger(stepId) || stepId < 1) return fail(400, { error: 'Invalid step' });

		try {
			return await createStudioApi(fetch, url.origin).deleteStep(id, stepId);
		} catch (cause) {
			return studioActionFailure(cause);
		}
	},

	moveStep: async ({ params, request, fetch, url }) => {
		const id = strategyId(params);
		const form = await request.formData();
		const stepId = Number(form.get('step_id'));
		const direction = String(form.get('direction'));
		if (!Number.isInteger(stepId) || (direction !== 'up' && direction !== 'down')) {
			return fail(400, { error: 'Invalid move' });
		}

		try {
			return await createStudioApi(fetch, url.origin).moveStep(id, stepId, direction);
		} catch (cause) {
			return studioActionFailure(cause);
		}
	}
};

function studioActionFailure(cause: unknown) {
	const clientErrors = new Set([
		'invalid_hero',
		'placement_not_owned',
		'hero_target_path',
		'invalid_move'
	]);
	return fail(clientErrors.has(chimpsErrorCode(cause) ?? '') ? 400 : 500, {
		error: chimpsErrorMessage(cause, 'Database operation failed.')
	});
}
