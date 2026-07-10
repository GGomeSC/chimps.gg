<script lang="ts">
	import EntityIcon from './EntityIcon.svelte';
	import type { StrategyMapPlacement, StrategyMapTower } from '$lib/types/public';

	let {
		placements,
		towers,
		selectedId,
		onselect
	}: {
		placements: StrategyMapPlacement[];
		towers: StrategyMapTower[];
		selectedId: number | null;
		onselect: (id: number) => void;
	} = $props();

	const towerById = $derived(new Map(towers.map((tower) => [tower.id, tower])));
</script>

<div class="legend" aria-label="Tower placements">
	{#each placements as placement, index (placement.id)}
		{@const tower = towerById.get(placement.towerId)}
		{#if tower}
			<button
				type="button"
				class:selected={selectedId === placement.id}
				aria-pressed={selectedId === placement.id}
				onclick={() => onselect(placement.id)}
			>
				<span class="number">{index + 1}</span>
				<EntityIcon src={tower.iconUrl} name={tower.name} compact />
				<span class="copy">
					<strong>{placement.label ?? tower.name}</strong>
					<small>
						{tower.name}{placement.finalPath ? ` · ${placement.finalPath}` : ''}
					</small>
					{#if placement.notes}<small>{placement.notes}</small>{/if}
				</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.legend {
		display: grid;
		gap: var(--space-2);
	}

	button {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: var(--space-2);
		align-items: center;
		width: 100%;
		min-height: var(--control-height);
		padding: var(--space-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface-raised);
		color: var(--fg);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	button:hover,
	button.selected {
		border-color: var(--brand);
		background: var(--brand-soft);
	}

	.number {
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		place-items: center;
		border-radius: 50%;
		background: var(--fg);
		color: var(--bg);
		font-size: var(--text-meta);
		font-weight: 900;
	}

	.copy {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	strong,
	small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	small {
		color: var(--fg-muted);
		font-size: var(--text-meta);
	}
</style>
