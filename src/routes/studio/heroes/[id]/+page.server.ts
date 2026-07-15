import { error, fail } from '@sveltejs/kit';
import {
	chimpsErrorCode,
	chimpsErrorMessage,
	createStudioApi
} from '$lib/server/chimps-client';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const heroId = integerId(params.id);
	if (!heroId) error(404, 'Hero not found');

	try {
		return await createStudioApi(fetch, url.origin).getHero(heroId);
	} catch (cause) {
		if (chimpsErrorCode(cause) === 'hero_not_found') error(404, 'Hero not found');
		error(500, `Failed to load hero: ${chimpsErrorMessage(cause, 'Unknown error')}`);
	}
};

export const actions: Actions = {
	default: async ({ params, request, fetch, url }) => {
		const heroId = integerId(params.id);
		if (!heroId) return fail(404, { error: 'Hero not found.' });

		const form = await request.formData();
		const synergyTowerIds = form.getAll('synergy_tower_ids').map(String);
		const synergyDescriptions = Object.fromEntries(
			synergyTowerIds.map((id) => [id, stringValue(form, `synergy_description_${id}`)])
		);
		const values = {
			description: stringValue(form, 'description'),
			baseCost: stringValue(form, 'base_cost'),
			attackStyle: stringValue(form, 'attack_style'),
			xpRatio: stringValue(form, 'xp_ratio'),
			technicalDescription: stringValue(form, 'technical_description'),
			profileSourceUrl: stringValue(form, 'profile_source_url'),
			synergyTowerIds,
			synergyDescriptions
		};

		const baseCost = optionalInteger(values.baseCost);
		if (baseCost === undefined || (baseCost !== null && baseCost < 0)) {
			return fail(400, { error: 'Base cost must be a non-negative whole number.', values });
		}

		const xpRatio = optionalNumber(values.xpRatio);
		if (xpRatio === undefined || (xpRatio !== null && (xpRatio <= 0 || xpRatio > 99.999))) {
			return fail(400, { error: 'XP ratio must be greater than 0 and at most 99.999.', values });
		}

		if (values.profileSourceUrl && !isHttpUrl(values.profileSourceUrl)) {
			return fail(400, { error: 'Source URL must use HTTP or HTTPS.', values });
		}

		const parsedSynergyTowerIds = values.synergyTowerIds.map(integerId);
		if (parsedSynergyTowerIds.some((id) => id === null)) {
			return fail(400, { error: 'Every synergy must reference a valid tower.', values });
		}
		if (new Set(parsedSynergyTowerIds).size !== parsedSynergyTowerIds.length) {
			return fail(400, { error: 'Synergy towers must be unique.', values });
		}

		try {
			return await createStudioApi(fetch, url.origin).updateHeroProfile(heroId, {
				description: values.description || null,
				base_cost: baseCost,
				attack_style: values.attackStyle || null,
				xp_ratio: xpRatio,
				technical_description: values.technicalDescription || null,
				profile_source_url: values.profileSourceUrl || null,
				synergy_tower_ids: parsedSynergyTowerIds as number[],
				synergy_descriptions: values.synergyTowerIds.map(
					(id) => values.synergyDescriptions[id] ?? ''
				)
			});
		} catch (cause) {
			return fail(400, {
				error: chimpsErrorMessage(cause, 'Invalid hero profile.'),
				values
			});
		}
	}
};

function stringValue(form: FormData, key: string): string {
	return String(form.get(key) ?? '').trim();
}

function integerId(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalInteger(value: string): number | null | undefined {
	if (!value) return null;
	if (!/^\d+$/.test(value)) return undefined;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function optionalNumber(value: string): number | null | undefined {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function isHttpUrl(value: string): boolean {
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
}
