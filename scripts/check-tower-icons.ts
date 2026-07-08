import { createClient } from '@supabase/supabase-js';
import { TOWER_ICON_BUCKET } from '../src/lib/tower-icons.js';
import type { Database } from '../src/lib/types/db.js';

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.includes('YOUR-PROJECT-REF') || value.startsWith('your-')) {
		console.error(`Missing ${name} - fill in .env (see .env.example).`);
		process.exit(1);
	}
	return value;
}

const supabase = createClient<Database>(
	requireEnv('PUBLIC_SUPABASE_URL'),
	requireEnv('SUPABASE_SECRET_KEY'),
	{ auth: { persistSession: false } }
);

const { data: bucket, error: bucketError } = await supabase.storage.getBucket(TOWER_ICON_BUCKET);
if (bucketError) {
	console.error(`Bucket ${TOWER_ICON_BUCKET} is not available: ${bucketError.message}`);
	console.error('Run npm run setup:tower-icons, then upload the tower icon files.');
	process.exit(1);
}
if (!bucket.public) {
	console.error(`Bucket ${TOWER_ICON_BUCKET} must be public.`);
	process.exit(1);
}

const { data: towers, error: towersError } = await supabase
	.from('towers')
	.select('id, name, icon_path')
	.order('name');

if (towersError) {
	console.error(`Failed to load towers: ${towersError.message}`);
	process.exit(1);
}

const failures: string[] = [];
for (const tower of towers ?? []) {
	if (!tower.icon_path) {
		failures.push(`${tower.name}: missing icon_path`);
		continue;
	}

	const { error } = await supabase.storage.from(TOWER_ICON_BUCKET).download(tower.icon_path);
	if (error) {
		failures.push(`${tower.name}: ${tower.icon_path} (${error.message})`);
	}
}

if (failures.length > 0) {
	console.error(`Missing tower icons (${failures.length}):`);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`All ${towers?.length ?? 0} tower icons exist in ${TOWER_ICON_BUCKET}.`);
