import { error, fail } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { towerIconUrl } from '$lib/server/tower-icons';
import type { Actions, PageServerLoad } from './$types';

const CATEGORY_ORDER = ['Primary', 'Military', 'Magic', 'Support'] as const;

export const load: PageServerLoad = async ({ params }) => {
	const heroId = integerId(params.id);
	if (!heroId) error(404, 'Hero not found');

	const [heroResult, towersResult] = await Promise.all([
		supabase
			.from('towers')
			.select(`
				id,
				name,
				category,
				icon_path,
				description,
				base_cost,
				attack_style,
				xp_ratio,
				technical_description,
				profile_source_url,
				synergies_from_a:tower_synergies!tower_synergies_tower_a_id_fkey(
					tower_b_id,
					description
				),
				synergies_from_b:tower_synergies!tower_synergies_tower_b_id_fkey(
					tower_a_id,
					description
				)
			`)
			.eq('id', heroId)
			.eq('category', 'Hero')
			.maybeSingle(),
		supabase
			.from('towers')
			.select('id, name, category')
			.neq('category', 'Hero')
			.order('name')
	]);

	if (heroResult.error) error(500, `Failed to load hero: ${heroResult.error.message}`);
	if (!heroResult.data) error(404, 'Hero not found');
	if (towersResult.error) error(500, `Failed to load towers: ${towersResult.error.message}`);

	const hero = heroResult.data;
	return {
		hero: {
			id: hero.id,
			name: hero.name,
			iconUrl: towerIconUrl(hero.icon_path),
			description: hero.description,
			baseCost: hero.base_cost,
			attackStyle: hero.attack_style,
			xpRatio: hero.xp_ratio,
			technicalDescription: hero.technical_description,
			profileSourceUrl: hero.profile_source_url,
			synergies: [
				...hero.synergies_from_a.map((synergy) => ({
					towerId: synergy.tower_b_id,
					description: synergy.description
				})),
				...hero.synergies_from_b.map((synergy) => ({
					towerId: synergy.tower_a_id,
					description: synergy.description
				}))
			]
		},
		towerGroups: CATEGORY_ORDER.map((category) => ({
			category,
			towers: towersResult.data.filter((tower) => tower.category === category)
		}))
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
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

		const result = await supabase.rpc('update_hero_profile', {
			p_hero_id: heroId,
			p_description: values.description || null,
			p_base_cost: baseCost,
			p_attack_style: values.attackStyle || null,
			p_xp_ratio: xpRatio,
			p_technical_description: values.technicalDescription || null,
			p_profile_source_url: values.profileSourceUrl || null,
			p_synergy_tower_ids: parsedSynergyTowerIds as number[],
			p_synergy_descriptions: values.synergyTowerIds.map(
				(id) => values.synergyDescriptions[id] ?? ''
			)
		});

		if (result.error) return fail(400, { error: result.error.message, values });
		return { success: true };
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
