// Shapes confirmed against the live API (see `npm run discover:nk`). Only add
// fields after seeing them in a real response — never guess.

export interface NkEnvelope<T> {
	success: boolean;
	error: string | null;
	body: T;
	next: string | null;
	prev: string | null;
}

// Item from /btd6/challenges/filter/newest
export interface NkChallengeListItem {
	name: string;
	createdAt: number;
	id: string;
	creator: string | null;
	metadata: string; // URL to full challenge metadata
}

// Item from /btd6/races
export interface NkRaceListItem {
	id: string;
	name: string;
	start: number;
	end: number;
	totalScores: number;
	leaderboard: string;
	metadata: string; // URL to full race metadata
}

// The subset of challenge/race metadata we consume. `map` is the internal
// official-map name (e.g. 'Cornfield') or 'CustomMap' for player-made maps;
// `mapURL` is official art on static-api.nkstatic.com for official maps.
export interface NkChallengeMetadata {
	name: string;
	map: string;
	mapURL: string;
}
