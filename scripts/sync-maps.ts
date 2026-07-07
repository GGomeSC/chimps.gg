// Harvests official BTD6 maps from the Ninja Kiwi Open Data API into `maps`.
//
// There is no official-maps list endpoint: official map internal names and art
// URLs only appear inside challenge/race metadata. So we sample current races
// plus recent challenge pages, collect distinct (map, mapURL) pairs, skip
// player-made maps ('CustomMap'), and upsert by nk_map_id. Idempotent and
// accumulative — reruns pick up maps earlier samples missed.
//
// Usage: npm run sync:maps [-- --pages N]   (default 8 challenge pages)
import { createClient } from '@supabase/supabase-js';
import { fetchChallengePage, fetchMetadata, fetchRaces } from '../src/lib/nk/client.js';
import type { Database, MapDifficulty } from '../src/lib/types/db.js';

// Official map roster: display name + difficulty. Neither is in the NK API
// (metadata only carries the internal name), so this is hand-maintained.
// Maps missing from this list still sync — with a prettified name, NULL
// difficulty, and a warning — and should then be added here.
const OFFICIAL_MAPS: Array<{ name: string; difficulty: MapDifficulty }> = [
	{ name: 'Monkey Meadow', difficulty: 'Beginner' },
	{ name: 'Tree Stump', difficulty: 'Beginner' },
	{ name: 'Town Center', difficulty: 'Beginner' },
	{ name: 'Middle of the Road', difficulty: 'Beginner' },
	{ name: 'One Two Tree', difficulty: 'Beginner' },
	{ name: 'Scrapyard', difficulty: 'Beginner' },
	{ name: 'The Cabin', difficulty: 'Beginner' },
	{ name: 'Resort', difficulty: 'Beginner' },
	{ name: 'Skates', difficulty: 'Beginner' },
	{ name: 'Lotus Island', difficulty: 'Beginner' },
	{ name: 'Candy Falls', difficulty: 'Beginner' },
	{ name: 'Winter Park', difficulty: 'Beginner' },
	{ name: 'Carved', difficulty: 'Beginner' },
	{ name: 'Park Path', difficulty: 'Beginner' },
	{ name: 'Alpine Run', difficulty: 'Beginner' },
	{ name: 'Frozen Over', difficulty: 'Beginner' },
	{ name: 'In The Loop', difficulty: 'Beginner' },
	{ name: 'Cubism', difficulty: 'Beginner' },
	{ name: 'Four Circles', difficulty: 'Beginner' },
	{ name: 'Hedge', difficulty: 'Beginner' },
	{ name: 'End of the Road', difficulty: 'Beginner' },
	{ name: 'Logs', difficulty: 'Beginner' },
	{ name: 'Tinkerton', difficulty: 'Beginner' },
	{ name: 'Luminous Cove', difficulty: 'Intermediate' },
	{ name: 'Water Park', difficulty: 'Intermediate' },
	{ name: 'Polyphemus', difficulty: 'Intermediate' },
	{ name: 'Covered Garden', difficulty: 'Intermediate' },
	{ name: 'Quarry', difficulty: 'Intermediate' },
	{ name: 'Quiet Street', difficulty: 'Intermediate' },
	{ name: 'Bloonarius Prime', difficulty: 'Intermediate' },
	{ name: 'Balance', difficulty: 'Intermediate' },
	{ name: 'Encrypted', difficulty: 'Intermediate' },
	{ name: 'Bazaar', difficulty: 'Intermediate' },
	{ name: "Adora's Temple", difficulty: 'Intermediate' },
	{ name: 'Spring Spring', difficulty: 'Intermediate' },
	{ name: 'KartsNDarts', difficulty: 'Intermediate' },
	{ name: 'Moon Landing', difficulty: 'Intermediate' },
	{ name: 'Haunted', difficulty: 'Intermediate' },
	{ name: 'Downstream', difficulty: 'Intermediate' },
	{ name: 'Firing Range', difficulty: 'Intermediate' },
	{ name: 'Cracked', difficulty: 'Intermediate' },
	{ name: 'Streambed', difficulty: 'Intermediate' },
	{ name: 'Chutes', difficulty: 'Intermediate' },
	{ name: 'Rake', difficulty: 'Intermediate' },
	{ name: 'Spice Islands', difficulty: 'Intermediate' },
	{ name: 'Enchanted Glade', difficulty: 'Intermediate' },
	{ name: 'Sulfur Springs', difficulty: 'Advanced' },
	{ name: 'Erosion', difficulty: 'Advanced' },
	{ name: 'Midnight Mansion', difficulty: 'Advanced' },
	{ name: 'Sunken Columns', difficulty: 'Advanced' },
	{ name: 'X Factor', difficulty: 'Advanced' },
	{ name: 'Mesa', difficulty: 'Advanced' },
	{ name: 'Geared', difficulty: 'Advanced' },
	{ name: 'Spillway', difficulty: 'Advanced' },
	{ name: 'Cargo', difficulty: 'Advanced' },
	{ name: "Pat's Pond", difficulty: 'Advanced' },
	{ name: 'Peninsula', difficulty: 'Advanced' },
	{ name: 'High Finance', difficulty: 'Advanced' },
	{ name: 'Another Brick', difficulty: 'Advanced' },
	{ name: 'Off the Coast', difficulty: 'Advanced' },
	{ name: 'Cornfield', difficulty: 'Advanced' },
	{ name: 'Underground', difficulty: 'Advanced' },
	{ name: 'Ancient Portal', difficulty: 'Advanced' },
	{ name: 'Castle Revenge', difficulty: 'Advanced' },
	{ name: 'Dark Path', difficulty: 'Expert' },
	{ name: 'Glacial Trail', difficulty: 'Expert' },
	{ name: 'Dark Dungeons', difficulty: 'Expert' },
	{ name: 'Sanctuary', difficulty: 'Expert' },
	{ name: 'Ravine', difficulty: 'Expert' },
	{ name: 'Flooded Valley', difficulty: 'Expert' },
	{ name: 'Infernal', difficulty: 'Expert' },
	{ name: 'Bloody Puddles', difficulty: 'Expert' },
	{ name: 'Workshop', difficulty: 'Expert' },
	{ name: 'Quad', difficulty: 'Expert' },
	{ name: 'Dark Castle', difficulty: 'Expert' },
	{ name: 'Muddy Puddles', difficulty: 'Expert' },
	{ name: '#Ouch', difficulty: 'Expert' },
	{ name: 'Lost Crevasse', difficulty: 'Intermediate' },
	{ name: 'Spa Pits', difficulty: 'Beginner' },
	{ name: 'Three Mines Around', difficulty: 'Beginner' },
	{ name: 'Skull Tweak', difficulty: 'Beginner' },
	{ name: 'Blons', difficulty: 'Expert' },
	{ name: 'Sunset Gulch', difficulty: 'Advanced' }
];

// Internal names that don't normalize to their display name.
const INTERNAL_ALIASES: Record<string, string> = {
	Tutorial: 'Monkey Meadow',
	TownCentre: 'Town Center'
};

const DEFAULT_PAGES = 8;
// Stop paging once this many consecutive pages yield no unseen maps.
const STALE_PAGE_LIMIT = 2;

function normalize(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function prettify(nkMapId: string): string {
	return nkMapId.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

const rosterByKey = new Map(OFFICIAL_MAPS.map((m) => [normalize(m.name), m]));

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.includes('YOUR-PROJECT-REF') || value.startsWith('your-')) {
		console.error(`Missing ${name} — fill in .env (see .env.example).`);
		process.exit(1);
	}
	return value;
}

const supabase = createClient<Database>(
	requireEnv('PUBLIC_SUPABASE_URL'),
	requireEnv('SUPABASE_SECRET_KEY'),
	{ auth: { persistSession: false } }
);

function parsePages(): number {
	const index = process.argv.indexOf('--pages');
	if (index === -1) return DEFAULT_PAGES;
	const pages = Number(process.argv[index + 1]);
	if (!Number.isInteger(pages) || pages < 1) {
		console.error('--pages must be a positive integer');
		process.exit(1);
	}
	return pages;
}

// nk_map_id -> official art URL
const found = new Map<string, string>();

function consider(map: string, mapURL: string): boolean {
	if (!map || map === 'CustomMap' || found.has(map)) return false;
	found.set(map, mapURL);
	return true;
}

async function harvestMetadata(metadataUrl: string, label: string): Promise<boolean> {
	try {
		const { body } = await fetchMetadata(metadataUrl);
		return consider(body.map, body.mapURL);
	} catch (error) {
		console.warn(`Skipping ${label}: ${error instanceof Error ? error.message : error}`);
		return false;
	}
}

const maxPages = parsePages();

console.log('Harvesting official maps from current races…');
const races = await fetchRaces();
for (const race of races.body) {
	await harvestMetadata(race.metadata, `race ${race.id}`);
}

console.log(`Harvesting from up to ${maxPages} pages of newest challenges…`);
let stalePages = 0;
for (let page = 1; page <= maxPages; page++) {
	const list = await fetchChallengePage(page);
	let newOnPage = 0;
	for (const challenge of list.body) {
		if (await harvestMetadata(challenge.metadata, `challenge ${challenge.id}`)) newOnPage++;
	}
	console.log(`  page ${page}: ${list.body.length} challenges, ${newOnPage} new maps`);
	stalePages = newOnPage === 0 ? stalePages + 1 : 0;
	if (stalePages >= STALE_PAGE_LIMIT) {
		console.log('  no new maps in a while, stopping early');
		break;
	}
	if (!list.next) break;
}

const now = new Date().toISOString();
const rows = [...found].map(([nkMapId, nkImageUrl]) => {
	const known = rosterByKey.get(normalize(INTERNAL_ALIASES[nkMapId] ?? nkMapId));
	if (!known) {
		console.warn(
			`Unknown map '${nkMapId}' — using prettified name and NULL difficulty; add it to OFFICIAL_MAPS in scripts/sync-maps.ts.`
		);
	}
	return {
		nk_map_id: nkMapId,
		name: known?.name ?? prettify(nkMapId),
		difficulty: known?.difficulty ?? null,
		nk_image_url: nkImageUrl,
		last_synced_at: now
		// image_url deliberately untouched: it's our own future-hosted asset.
	};
});

if (rows.length === 0) {
	console.error('No official maps found — API shape may have changed. Run npm run discover:nk.');
	process.exit(1);
}

const { error: upsertError } = await supabase
	.from('maps')
	.upsert(rows, { onConflict: 'nk_map_id' });
if (upsertError) {
	console.error(`Upsert failed: ${upsertError.message}`);
	process.exit(1);
}

const { count, error: countError } = await supabase
	.from('maps')
	.select('*', { count: 'exact', head: true });
if (countError) {
	console.error(`Count failed: ${countError.message}`);
	process.exit(1);
}

console.log(`\nDone. Upserted ${rows.length} maps this run; maps table now has ${count} rows.`);
