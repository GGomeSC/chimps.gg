import { error, json } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createStudioApi
} from '$lib/server/chimps-client';
import { isNormalized, PATH_PATTERN } from '$lib/server/placements';
import type { PlacementInsert } from '$lib/types/db';
import type { RequestHandler } from './$types';

function placementIds(params: { id: string; pid: string }) {
	const strategyId = Number(params.id);
	const placementId = Number(params.pid);
	if (!Number.isInteger(strategyId) || !Number.isInteger(placementId)) error(404, 'Not found');
	return { strategyId, placementId };
}

export const PATCH: RequestHandler = async ({ params, request, fetch, url }) => {
	const { strategyId, placementId } = placementIds(params);
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
		}
		patch.final_path = body.final_path;
	}

	if ('label' in body) patch.label = nullableText(body.label, 'label');
	if ('notes' in body) patch.notes = nullableText(body.notes, 'notes');

	if (Object.keys(patch).length === 0) error(400, 'Nothing to update');

	try {
		const updated = await createStudioApi(fetch, url.origin).updatePlacement(
			strategyId,
			placementId,
			patch
		);
		return json(updated);
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'placement_not_found') error(404, 'Placement not found');
		if (chimpsErrorCode(cause) === 'hero_crosspath') {
			error(400, 'Heroes have no crosspath; final_path must stay empty');
		}
		error(500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};

export const DELETE: RequestHandler = async ({ params, fetch, url }) => {
	const { strategyId, placementId } = placementIds(params);
	try {
		await createStudioApi(fetch, url.origin).deletePlacement(strategyId, placementId);
		return new Response(null, { status: 204 });
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'placement_not_found') error(404, 'Placement not found');
		error(500, chimpsErrorMessage(cause, 'Database operation failed.'));
	}
};

function nullableText(value: unknown, field: string): string | null {
	if (value === null) return null;
	if (typeof value !== 'string') error(400, `${field} must be a string or null`);
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}
