import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { towerIconUrl } from '$lib/server/tower-icons';
import type { PageServerLoad } from './$types';

const PROFILE_FIELDS = [
	'description',
	'base_cost',
	'attack_style',
	'xp_ratio',
	'technical_description',
	'profile_source_url'
] as const;

export const load: PageServerLoad = async () => {
	const result = await supabase
		.from('towers')
		.select(`
			id,
			name,
			icon_path,
			description,
			base_cost,
			attack_style,
			xp_ratio,
			technical_description,
			profile_source_url,
			synergies_from_a:tower_synergies!tower_synergies_tower_a_id_fkey(id),
			synergies_from_b:tower_synergies!tower_synergies_tower_b_id_fkey(id)
		`)
		.eq('category', 'Hero')
		.order('name');

	if (result.error) error(500, `Failed to load heroes: ${result.error.message}`);

	return {
		heroes: result.data.map((hero) => ({
			id: hero.id,
			name: hero.name,
			iconUrl: towerIconUrl(hero.icon_path),
			completedFields: PROFILE_FIELDS.filter((field) => hero[field] !== null).length,
			totalFields: PROFILE_FIELDS.length,
			synergyCount: hero.synergies_from_a.length + hero.synergies_from_b.length
		}))
	};
};
