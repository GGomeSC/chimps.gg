import { error, json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { heroPlacementError, isNormalized } from '$lib/server/placements';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const strategyId = Number(params.id);
	if (!Number.isInteger(strategyId) || strategyId < 1) error(404, 'Not found');

	const body = await request.json().catch(() => null);
	const towerId = Number(body?.tower_id);
	if (!Number.isInteger(towerId) || towerId < 1) error(400, 'tower_id is required');
	if (!isNormalized(body?.pos_x) || !isNormalized(body?.pos_y)) {
		error(400, 'pos_x and pos_y must be numbers in [0, 1]');
	}

	const heroError = await heroPlacementError(strategyId, towerId);
	if (heroError) error(400, heroError);

	const { data: created, error: dbError } = await supabase
		.from('placements')
		.insert({ strategy_id: strategyId, tower_id: towerId, pos_x: body.pos_x, pos_y: body.pos_y })
		.select('*')
		.single();
	if (dbError) error(500, dbError.message);

	return json(created, { status: 201 });
};
