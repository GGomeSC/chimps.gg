// Parses and validates the strategy metadata form shared by the create and
// edit actions. Returns either the row payload or a user-facing error.
import type { StrategyInsert, StrategyStatus } from '$lib/types/db';

const STATUSES: readonly StrategyStatus[] = ['draft', 'ready', 'archived'];

export type StrategyFormResult =
	| { ok: true; data: StrategyInsert }
	| { ok: false; error: string };

export function parseStrategyForm(form: FormData): StrategyFormResult {
	const title = text(form, 'title');
	if (!title) return { ok: false, error: 'Title is required' };

	const mapId = id(form, 'map_id');
	if (!mapId) return { ok: false, error: 'Map is required' };

	const gameModeId = id(form, 'game_mode_id');
	if (!gameModeId) return { ok: false, error: 'Game mode is required' };

	const heroRaw = text(form, 'hero_id');
	const heroId = heroRaw ? id(form, 'hero_id') : null;
	if (heroRaw && !heroId) return { ok: false, error: 'Invalid hero' };

	const execRaw = text(form, 'exec_difficulty');
	const execDifficulty = execRaw ? Number(execRaw) : null;
	if (execDifficulty !== null && (!Number.isInteger(execDifficulty) || execDifficulty < 1 || execDifficulty > 5)) {
		return { ok: false, error: 'Execution difficulty must be between 1 and 5' };
	}

	const status = (text(form, 'status') ?? 'draft') as StrategyStatus;
	if (!STATUSES.includes(status)) return { ok: false, error: 'Invalid status' };

	// Keys are DB columns (snake_case); locals are camelCase.
	return {
		ok: true,
		data: {
			title,
			map_id: mapId,
			game_mode_id: gameModeId,
			hero_id: heroId,
			exec_difficulty: execDifficulty,
			status,
			description: text(form, 'description'),
			source_url: text(form, 'source_url'),
			verified_version: text(form, 'verified_version')
		}
	};
}

function text(form: FormData, name: string): string | null {
	const value = form.get(name);
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed === '' ? null : trimmed;
}

function id(form: FormData, name: string): number | null {
	const value = Number(text(form, name));
	return Number.isInteger(value) && value > 0 ? value : null;
}
