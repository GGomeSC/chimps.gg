<script lang="ts">
	import type { StrategyFilterOptions, StrategyFilters } from '$lib/types/public';

	let { filters, options }: { filters: StrategyFilters; options: StrategyFilterOptions } = $props();

	function submit(event: Event) {
		(event.currentTarget as HTMLFormElement).requestSubmit();
	}
</script>

<form class="filters" method="GET" action="/strategies" onchange={submit}>
	<div class="filter-heading">
		<div>
			<span class="eyebrow">Find your run</span>
			<h2>Strategy filters</h2>
		</div>
		<a href="/strategies">Reset all</a>
	</div>

	<div class="fields">
		<label>
			Map
			<select name="map" value={filters.mapId ?? ''}>
				<option value="">All maps</option>
				{#each options.maps as map (map.id)}
					<option value={map.id}>{map.name}</option>
				{/each}
			</select>
		</label>

		<label>
			Mode
			<select name="mode" value={filters.modeId ?? ''}>
				<option value="">All modes</option>
				{#each options.modes as mode (mode.id)}
					<option value={mode.id}>{mode.name}</option>
				{/each}
			</select>
		</label>

		<label>
			Hero
			<select name="hero" value={filters.heroId ?? ''}>
				<option value="">All heroes</option>
				{#each options.heroes as hero (hero.id)}
					<option value={hero.id}>{hero.name}</option>
				{/each}
			</select>
		</label>

		<label>
			Execution difficulty
			<select name="difficulty" value={filters.executionDifficulty ?? ''}>
				<option value="">Any rating</option>
				{#each [1, 2, 3, 4, 5] as difficulty}
					<option value={difficulty}>{difficulty} / 5</option>
				{/each}
			</select>
		</label>

		<label>
			Map difficulty
			<select name="mapDifficulty" value={filters.mapDifficulty ?? ''}>
				<option value="">All tiers</option>
				{#each ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as difficulty}
					<option value={difficulty}>{difficulty}</option>
				{/each}
			</select>
		</label>

		<label>
			Verified version
			<select name="version" value={filters.version ?? ''}>
				<option value="">All versions</option>
				{#each options.versions as version}
					<option value={version}>v{version}</option>
				{/each}
			</select>
		</label>
	</div>

	<button class="button" type="submit">Apply filters</button>
</form>

<style>
	.filters {
		display: grid;
		gap: 1rem;
		padding: clamp(1rem, 3vw, 1.5rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
		container-type: inline-size;
	}

	.filter-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}

	.eyebrow {
		color: var(--brand-strong);
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0.15rem 0 0;
		font-size: 1.2rem;
	}

	.filter-heading a {
		color: var(--fg-muted);
		font-size: 0.85rem;
	}

	.fields {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.8rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
		color: var(--fg-muted);
		font-size: 0.78rem;
		font-weight: 750;
	}

	select {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.5rem 2.4rem 0.5rem 0.7rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background-color: var(--bg);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23889486' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		color: var(--fg);
		font: inherit;
		font-size: 0.9rem;
		appearance: none;
		-webkit-appearance: none;
	}

	select:hover {
		border-color: var(--brand);
	}

	.filters > button {
		width: fit-content;
	}

	/* Size columns by the panel's own width, not the viewport, so the narrow
	   sidebar stacks cleanly while a full-width panel (mobile) can go wider. */
	@container (min-width: 26rem) {
		.fields {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@container (min-width: 40rem) {
		.fields {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
