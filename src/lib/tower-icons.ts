import type { TowerRow } from './types/db.js';

export const TOWER_ICON_BUCKET = 'tower-icons';
export const TOWER_ICON_FILE_SIZE_LIMIT = 256 * 1024;
export const TOWER_ICON_MIME_TYPES = ['image/webp', 'image/png'] as const;

export type TowerWithIcon = TowerRow & {
	icon_url: string;
};
