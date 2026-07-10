import type { PlacementRow, TowerRow } from '$lib/types/db';
import type { StrategyMapPlacement, StrategyMapTower } from '$lib/types/public';

export function toStrategyMapPlacement(placement: PlacementRow): StrategyMapPlacement {
	return {
		id: placement.id,
		towerId: placement.tower_id,
		x: placement.pos_x,
		y: placement.pos_y,
		finalPath: placement.final_path,
		label: placement.label,
		notes: placement.notes
	};
}

export function toStrategyMapTower(
	tower: Pick<TowerRow, 'id' | 'name' | 'category'>,
	iconUrl: string
): StrategyMapTower {
	return { id: tower.id, name: tower.name, category: tower.category, iconUrl };
}
