// Server-only Supabase client using the secret key. SvelteKit refuses
// to bundle $env/static/private into client code, so importing this file from
// the browser is a build error — keep it that way.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Database } from '$lib/types/db';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: { persistSession: false }
});
