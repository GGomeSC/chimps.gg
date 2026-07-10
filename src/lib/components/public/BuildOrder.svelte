<script lang="ts">
	import EntityIcon from './EntityIcon.svelte';
	import type {
		PublicStep,
		StrategyMapPlacement,
		StrategyMapTower
	} from '$lib/types/public';

	let {
		steps,
		placements,
		towers
	}: {
		steps: PublicStep[];
		placements: StrategyMapPlacement[];
		towers: StrategyMapTower[];
	} = $props();

	const placementById = $derived(new Map(placements.map((placement) => [placement.id, placement])));
	const towerById = $derived(new Map(towers.map((tower) => [tower.id, tower])));

	function towerForStep(placementId: number | null): StrategyMapTower | null {
		if (!placementId) return null;
		const placement = placementById.get(placementId);
		if (!placement) return null;
		return towerById.get(placement.towerId) ?? null;
	}

	function placementName(placementId: number | null): string | null {
		if (!placementId) return null;
		const placement = placementById.get(placementId);
		if (!placement) return null;
		return placement.label ?? towerById.get(placement.towerId)?.name ?? null;
	}

	function actionLabel(action: PublicStep['action']): string {
		return action.charAt(0).toUpperCase() + action.slice(1);
	}
</script>

<ol class="build-order">
	{#each steps as step, index (step.id)}
		{@const tower = towerForStep(step.placementId)}
		<li>
			<div class="rail" aria-hidden="true">
				<span>{index + 1}</span>
			</div>
			<article>
				<div class="icon">
					{#if tower}
						<EntityIcon src={tower.iconUrl} name={tower.name} compact />
					{:else}
						<span class="placeholder" aria-hidden="true">•</span>
					{/if}
				</div>
				<div class="body">
					<header>
						<span class="round">Round {step.roundNumber}</span>
						<span class="action">{actionLabel(step.action)}</span>
					</header>
					{#if placementName(step.placementId)}
						<strong>{placementName(step.placementId)}</strong>
					{/if}
					{#if step.targetPath}<span class="path">Target path {step.targetPath}</span>{/if}
					{#if step.description}<p>{step.description}</p>{/if}
				</div>
			</article>
		</li>
	{/each}
</ol>

<style>
	.build-order {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 2.5rem minmax(0, 1fr);
		gap: var(--space-2);
	}

	.rail {
		position: relative;
		display: flex;
		justify-content: center;
	}

	.rail::after {
		position: absolute;
		top: 2rem;
		bottom: 0;
		width: 2px;
		background: var(--border);
		content: '';
	}

	li:last-child .rail::after {
		display: none;
	}

	.rail span {
		position: relative;
		z-index: 1;
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border: 3px solid var(--bg);
		border-radius: 50%;
		background: var(--brand);
		color: var(--ink);
		font-size: var(--text-meta);
		font-weight: 950;
	}

	article {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-3);
		align-items: start;
		margin-bottom: var(--space-3);
		padding: var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-raised);
	}

	.icon {
		display: grid;
		place-items: center;
		padding-top: 0.1rem;
	}

	.placeholder {
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--fg-muted);
		font-size: 1rem;
		line-height: 1;
	}

	.body {
		display: grid;
		gap: var(--space-1);
		min-width: 0;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-items: center;
	}

	.round,
	.action,
	.path {
		width: fit-content;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: var(--text-meta);
		font-weight: 850;
	}

	.round {
		background: var(--brand-soft);
		color: var(--brand-strong);
	}

	.action,
	.path {
		background: var(--surface);
		color: var(--fg-muted);
	}

	p {
		margin: 0;
		color: var(--fg-muted);
		line-height: 1.55;
		font-size: var(--text-body);
	}
</style>
