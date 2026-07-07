import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data: maps, error: dbError } = await supabase
		.from('maps')
		.select('*')
		.order('difficulty', { ascending: true, nullsFirst: false })
		.order('name', { ascending: true });

	if (dbError) {
		error(500, `Failed to load maps: ${dbError.message}`);
	}

	return { maps };
};
