// Shared validation for the placement JSON endpoints.
import { supabase } from '$lib/server/supabase';

export const PATH_PATTERN = /^[0-5]-[0-5]-[0-5]$/;

export function isNormalized(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

/** User-facing message, or null when valid. */
export async function heroPlacementError(
	strategyId: number,
	towerId: number,
	excludePlacementId?: number
): Promise<string | null> {
	const { data: tower, error } = await supabase
		.from('towers')
		.select('category')
		.eq('id', towerId)
		.maybeSingle();
	if (error) return error.message;
	if (!tower) return 'Unknown tower';
	if (tower.category !== 'Hero') return null;

	const { data: heroes } = await supabase.from('towers').select('id').eq('category', 'Hero');
	const heroIds = (heroes ?? []).map((h) => h.id);
	let query = supabase
		.from('placements')
		.select('id')
		.eq('strategy_id', strategyId)
		.in('tower_id', heroIds);
	if (excludePlacementId) query = query.neq('id', excludePlacementId);
	const { data: existing } = await query.limit(1);
	return existing && existing.length > 0 ? 'Strategy already has a hero placement' : null;
}

export async function isHeroTower(towerId: number): Promise<boolean> {
	const { data } = await supabase.from('towers').select('category').eq('id', towerId).maybeSingle();
	return data?.category === 'Hero';
}
