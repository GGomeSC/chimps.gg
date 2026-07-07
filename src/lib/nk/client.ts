// Minimal typed client for the Ninja Kiwi Open Data API.
// Politeness rules: callers must make requests sequentially; nkFetch enforces
// a minimum delay between requests and identifies us with a User-Agent.
import type {
	NkChallengeListItem,
	NkChallengeMetadata,
	NkEnvelope,
	NkRaceListItem
} from './types';

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required env var ${name} (see .env.example)`);
	}
	return value;
}

// API root, supplied entirely via the required NK_API_ROOT env var (see
// .env.example) — no URL literals live in the source. Read from process.env
// rather than $env/* because this module also runs in the tsx scripts, which
// execute outside the SvelteKit/Vite build where $env/* is unavailable.
export const NK_API_ROOT = requireEnv('NK_API_ROOT');

const USER_AGENT = 'chimps.gg-sync/0.1 (community strategy site; low-volume sync)';
const MIN_REQUEST_INTERVAL_MS = 200;

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function nkFetch<T>(url: string): Promise<NkEnvelope<T>> {
	const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
	if (wait > 0) await sleep(wait);
	lastRequestAt = Date.now();

	let response: Response;
	try {
		response = await requestOnce(url);
	} catch {
		// One retry after a beat, for transient network hiccups.
		await sleep(1000);
		response = await requestOnce(url);
	}

	if (!response.ok) {
		throw new Error(`NK API ${response.status} for ${url}`);
	}
	const envelope = (await response.json()) as NkEnvelope<T>;
	if (!envelope.success) {
		throw new Error(`NK API error for ${url}: ${envelope.error ?? 'unknown'}`);
	}
	return envelope;
}

function requestOnce(url: string): Promise<Response> {
	return fetch(url, {
		headers: { Accept: 'application/json', 'User-Agent': USER_AGENT }
	});
}

export function fetchChallengePage(page: number): Promise<NkEnvelope<NkChallengeListItem[]>> {
	return nkFetch<NkChallengeListItem[]>(
		`${NK_API_ROOT}/btd6/challenges/filter/newest?page=${page}`
	);
}

export function fetchRaces(): Promise<NkEnvelope<NkRaceListItem[]>> {
	return nkFetch<NkRaceListItem[]>(`${NK_API_ROOT}/btd6/races`);
}

export function fetchMetadata(url: string): Promise<NkEnvelope<NkChallengeMetadata>> {
	return nkFetch<NkChallengeMetadata>(url);
}
