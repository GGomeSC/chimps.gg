import { env } from '$env/dynamic/private';
import { createClient } from './generated/chimps/client/client.gen';
import {
	createStudioPlacement,
	createStudioStep,
	createStudioStrategy,
	deleteStudioPlacement,
	deleteStudioStep,
	deleteStudioStrategy,
	getStudioHero,
	getStudioHeroes,
	getStudioMaps,
	getStudioStrategies,
	getStudioStrategy,
	getStudioStrategyReferences,
	moveStudioStep,
	updateStudioHeroProfile,
	updateStudioPlacement,
	updateStudioStep,
	updateStudioStrategyMetadata
} from './generated/chimps/sdk.gen';
import type {
	HeroProfileInput,
	PlacementCreateInput,
	PlacementUpdateInput,
	StepInput,
	StrategyInput
} from './generated/chimps/types.gen';

function createChimpsClient(fetcher: typeof fetch, origin: string) {
	const internalServiceSecret = env.INTERNAL_SERVICE_SECRET;
	if (!internalServiceSecret) {
		throw new Error('INTERNAL_SERVICE_SECRET is not configured.');
	}

	return createClient({
		baseUrl: `${origin}/api/chimps`,
		fetch: fetcher,
		headers: {
			Authorization: `Bearer ${internalServiceSecret}`
		},
		responseStyle: 'fields',
		throwOnError: true
	});
}

export function createStudioApi(fetcher: typeof fetch, origin: string) {
	const client = createChimpsClient(fetcher, origin);
	const options = { client };

	return {
		getMaps: () => unwrap(getStudioMaps(options)),
		getStrategyReferences: () => unwrap(getStudioStrategyReferences(options)),
		getStrategies: () => unwrap(getStudioStrategies(options)),
		getStrategy: (strategyId: number) =>
			unwrap(getStudioStrategy({ ...options, path: { strategyId } })),
		createStrategy: (body: StrategyInput) =>
			unwrap(createStudioStrategy({ ...options, body })),
		updateStrategy: (strategyId: number, body: StrategyInput) =>
			unwrap(updateStudioStrategyMetadata({ ...options, path: { strategyId }, body })),
		deleteStrategy: (strategyId: number) =>
			unwrap(deleteStudioStrategy({ ...options, path: { strategyId } })),
		createStep: (strategyId: number, body: StepInput) =>
			unwrap(createStudioStep({ ...options, path: { strategyId }, body })),
		updateStep: (strategyId: number, stepId: number, body: StepInput) =>
			unwrap(updateStudioStep({ ...options, path: { strategyId, stepId }, body })),
		deleteStep: (strategyId: number, stepId: number) =>
			unwrap(deleteStudioStep({ ...options, path: { strategyId, stepId } })),
		moveStep: (strategyId: number, stepId: number, direction: 'up' | 'down') =>
			unwrap(moveStudioStep({ ...options, path: { strategyId, stepId }, body: { direction } })),
		createPlacement: (strategyId: number, body: PlacementCreateInput) =>
			unwrap(createStudioPlacement({ ...options, path: { strategyId }, body })),
		updatePlacement: (strategyId: number, placementId: number, body: PlacementUpdateInput) =>
			unwrap(updateStudioPlacement({ ...options, path: { strategyId, placementId }, body })),
		deletePlacement: (strategyId: number, placementId: number) =>
			unwrap(deleteStudioPlacement({ ...options, path: { strategyId, placementId } })),
		getHeroes: () => unwrap(getStudioHeroes(options)),
		getHero: (heroId: number) => unwrap(getStudioHero({ ...options, path: { heroId } })),
		updateHeroProfile: (heroId: number, body: HeroProfileInput) =>
			unwrap(updateStudioHeroProfile({ ...options, path: { heroId }, body }))
	};
}

async function unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
	return (await request).data;
}

export function chimpsErrorMessage(value: unknown, fallback: string): string {
	if (
		typeof value === 'object' &&
		value !== null &&
		'message' in value &&
		typeof value.message === 'string'
	) {
		return value.message;
	}
	return fallback;
}

export function chimpsErrorCode(value: unknown): string | null {
	if (
		typeof value === 'object' &&
		value !== null &&
		'code' in value &&
		typeof value.code === 'string'
	) {
		return value.code;
	}
	return null;
}
