import { m } from '$lib/paraglide/messages.js';
import type { MapDifficulty, StepAction } from '$lib/types/db';

/** Localized display name for a map difficulty tier (DB values stay English). */
export function mapDifficultyLabel(difficulty: MapDifficulty): string {
	switch (difficulty) {
		case 'Beginner':
			return m.difficulty_beginner();
		case 'Intermediate':
			return m.difficulty_intermediate();
		case 'Advanced':
			return m.difficulty_advanced();
		case 'Expert':
			return m.difficulty_expert();
	}
}

/** Localized display name for a build-order step action. */
export function stepActionLabel(action: StepAction): string {
	switch (action) {
		case 'place':
			return m.action_place();
		case 'upgrade':
			return m.action_upgrade();
		case 'sell':
			return m.action_sell();
		case 'retarget':
			return m.action_retarget();
		case 'other':
			return m.action_other();
	}
}
