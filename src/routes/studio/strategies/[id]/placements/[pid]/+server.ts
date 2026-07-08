import { error, json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { isHeroTower, isNormalized, PATH_PATTERN } from '$lib/server/placements';
import type { PlacementInsert, PlacementRow } from '$lib/types/db';
import type { RequestHandler } from './$types';

async function loadPlacement(params: { id: string; pid: string }): Promise<PlacementRow> {
	const strategyId = Number(params.id);
	const placementId = Number(params.pid);
	if (!Number.isInteger(strategyId) || !Number.isInteger(placementId)) error(404, 'Not found');

	const { data, error: dbError } = await supabase
		.from('placements')
		.select('*')
		.eq('id', placementId)
		.eq('strategy_id', strategyId)
		.maybeSingle();
	if (dbError) error(500, dbError.message);
	if (!data) error(404, 'Placement not found');
	return data;
}

export const PATCH: RequestHandler = async ({ params, request }) => {
	const placement = await loadPlacement(params);
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') error(400, 'Invalid body');

	const patch: Partial<PlacementInsert> = {};

	if ('pos_x' in body || 'pos_y' in body) {
		if (!isNormalized(body.pos_x) || !isNormalized(body.pos_y)) {
			error(400, 'pos_x and pos_y must be numbers in [0, 1]');
		}
		patch.pos_x = body.pos_x;
		patch.pos_y = body.pos_y;
	}

	if ('final_path' in body) {
		if (body.final_path !== null) {
			if (typeof body.final_path !== 'string' || !PATH_PATTERN.test(body.final_path)) {
				error(400, 'final_path must match 0-0-0 … 5-5-5');
			}
			if (await isHeroTower(placement.tower_id)) {
				error(400, 'Heroes have no crosspath; final_path must stay empty');
			}
		}
		patch.final_path = body.final_path;
	}

	if ('label' in body) patch.label = nullableText(body.label, 'label');
	if ('notes' in body) patch.notes = nullableText(body.notes, 'notes');

	if (Object.keys(patch).length === 0) error(400, 'Nothing to update');

	const { data: updated, error: dbError } = await supabase
		.from('placements')
		.update(patch)
		.eq('id', placement.id)
		.select('*')
		.single();
	if (dbError) error(500, dbError.message);

	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const placement = await loadPlacement(params);

	// Cascades to steps that reference this placement.
	const { error: dbError } = await supabase.from('placements').delete().eq('id', placement.id);
	if (dbError) error(500, dbError.message);

	return new Response(null, { status: 204 });
};

function nullableText(value: unknown, field: string): string | null {
	if (value === null) return null;
	if (typeof value !== 'string') error(400, `${field} must be a string or null`);
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}
