import { error, json } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createStudioApi
} from '$lib/server/chimps-client';
import { isNormalized } from '$lib/server/placements';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, fetch, url }) => {
	const strategyId = Number(params.id);
	if (!Number.isInteger(strategyId) || strategyId < 1) error(404, 'Not found');

	const body = await request.json().catch(() => null);
	const towerId = Number(body?.tower_id);
	if (!Number.isInteger(towerId) || towerId < 1) error(400, 'tower_id is required');
	if (!isNormalized(body?.pos_x) || !isNormalized(body?.pos_y)) {
		error(400, 'pos_x and pos_y must be numbers in [0, 1]');
	}

	try {
		const created = await createStudioApi(fetch, url.origin).createPlacement(strategyId, {
			tower_id: towerId,
			pos_x: body.pos_x,
			pos_y: body.pos_y
		});
		return json(created, { status: 201 });
	} catch (cause) {
		const clientError = ['unknown_tower', 'hero_already_placed'].includes(
			chimpsErrorCode(cause) ?? ''
		);
		error(clientError ? 400 : 500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};
