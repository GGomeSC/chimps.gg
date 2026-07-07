// Shape-discovery step for the NK Open Data API: fetches one list response and
// one metadata response and prints them raw. Run this (npm run discover:nk)
// before mapping any new field into the database — never guess field names.
import { fetchChallengePage, fetchMetadata } from '../src/lib/nk/client.js';

const list = await fetchChallengePage(1);
console.log('=== /btd6/challenges/filter/newest (envelope keys) ===');
console.log(Object.keys(list));
console.log('\n=== first list item ===');
console.log(JSON.stringify(list.body[0], null, 2));

const metadata = await fetchMetadata(list.body[0].metadata);
console.log('\n=== that item\'s metadata body ===');
console.log(JSON.stringify(metadata.body, null, 2));
