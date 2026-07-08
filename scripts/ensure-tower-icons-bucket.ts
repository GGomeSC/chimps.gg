import { createClient } from '@supabase/supabase-js';
import {
	TOWER_ICON_BUCKET,
	TOWER_ICON_FILE_SIZE_LIMIT,
	TOWER_ICON_MIME_TYPES
} from '../src/lib/tower-icons.js';
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

const bucketOptions = {
	public: true,
	allowedMimeTypes: [...TOWER_ICON_MIME_TYPES],
	fileSizeLimit: TOWER_ICON_FILE_SIZE_LIMIT
};

const { data: bucket, error: getError } = await supabase.storage.getBucket(TOWER_ICON_BUCKET);

if (bucket && !getError) {
	const { error } = await supabase.storage.updateBucket(TOWER_ICON_BUCKET, bucketOptions);
	if (error) {
		console.error(`Failed to update ${TOWER_ICON_BUCKET}: ${error.message}`);
		process.exit(1);
	}
	console.log(`Updated public bucket ${TOWER_ICON_BUCKET}.`);
} else {
	const { error } = await supabase.storage.createBucket(TOWER_ICON_BUCKET, bucketOptions);
	if (error) {
		console.error(`Failed to create ${TOWER_ICON_BUCKET}: ${error.message}`);
		process.exit(1);
	}
	console.log(`Created public bucket ${TOWER_ICON_BUCKET}.`);
}
