import { supabase } from '$lib/server/supabase';
import { TOWER_ICON_BUCKET } from '$lib/tower-icons';

export function towerIconUrl(iconPath: string): string {
	return supabase.storage.from(TOWER_ICON_BUCKET).getPublicUrl(iconPath).data.publicUrl;
}
