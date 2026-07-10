<script lang="ts">
	import type { StrategyFilterOptions, StrategyFilters } from '$lib/types/public';

	type Props = {
		filters: StrategyFilters;
		options: StrategyFilterOptions;
		query?: string;
	};

	let { filters, options, query = $bindable('') }: Props = $props();

	let searchInput: HTMLInputElement | undefined = $state();

	// Each change applies immediately; SvelteKit's router handles the GET
	// submission client-side. The form has no cursor input, so paging resets.
	function submit(event: Event) {
		(event.currentTarget as HTMLFormElement).requestSubmit();
	}

	function focusSearch(event: KeyboardEvent) {
		if (event.key !== '/' || event.defaultPrevented) return;
		const target = event.target as HTMLElement | null;
		if (target && /^(input|select|textarea)$/i.test(target.tagName)) return;
		event.preventDefault();
		searchInput?.focus();
	}

	type Chip = { key: keyof StrategyFilters; label: string };

	const chips = $derived.by<Chip[]>(() => {
		const active: Chip[] = [];
		if (filters.mapId) {
			active.push({
				key: 'mapId',
				label: options.maps.find((map) => map.id === filters.mapId)?.name ?? 'Map'
			});
		}
		if (filters.modeId) {
			active.push({
				key: 'modeId',
				label: options.modes.find((mode) => mode.id === filters.modeId)?.name ?? 'Mode'
			});
		}
		if (filters.heroId) {
			active.push({
				key: 'heroId',
				label: options.heroes.find((hero) => hero.id === filters.heroId)?.name ?? 'Hero'
			});
		}
		if (filters.executionDifficulty) {
			active.push({ key: 'executionDifficulty', label: `Execution ${filters.executionDifficulty}/5` });
		}
		if (filters.mapDifficulty) active.push({ key: 'mapDifficulty', label: filters.mapDifficulty });
		if (filters.version) active.push({ key: 'version', label: `v${filters.version}` });
		return active;
	});

	function hrefWithout(removed: keyof StrategyFilters): string {
		const params = new URLSearchParams();
		if (filters.mapId && removed !== 'mapId') params.set('map', String(filters.mapId));
		if (filters.modeId && removed !== 'modeId') params.set('mode', String(filters.modeId));
		if (filters.heroId && removed !== 'heroId') params.set('hero', String(filters.heroId));
		if (filters.executionDifficulty && removed !== 'executionDifficulty')
			params.set('difficulty', String(filters.executionDifficulty));
		if (filters.mapDifficulty && removed !== 'mapDifficulty')
			params.set('mapDifficulty', filters.mapDifficulty);
		if (filters.version && removed !== 'version') params.set('version', filters.version);
		const search = params.toString();
		return search ? `/strategies?${search}` : '/strategies';
	}
</script>

<svelte:window onkeydown={focusSearch} />

<form class="filter-bar" method="GET" action="/strategies" onchange={submit} data-sveltekit-keepfocus data-sveltekit-noscroll>
	<div class="controls">
		<label class="search">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<circle cx="11" cy="11" r="7" />
				<path d="m20 20-3.5-3.5" />
			</svg>
			<input
				bind:this={searchInput}
				bind:value={query}
				type="search"
				placeholder="Search title, map, hero…"
				aria-label="Search loaded strategies"
			/>
			<kbd aria-hidden="true">/</kbd>
		</label>

		<label>
			<span>Map</span>
			<select name="map" value={filters.mapId ?? ''}>
				<option value="">All</option>
				{#each options.maps as map (map.id)}
					<option value={map.id}>{map.name}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Mode</span>
			<select name="mode" value={filters.modeId ?? ''}>
				<option value="">All</option>
				{#each options.modes as mode (mode.id)}
					<option value={mode.id}>{mode.name}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Hero</span>
			<select name="hero" value={filters.heroId ?? ''}>
				<option value="">All</option>
				{#each options.heroes as hero (hero.id)}
					<option value={hero.id}>{hero.name}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Execution</span>
			<select name="difficulty" value={filters.executionDifficulty ?? ''}>
				<option value="">Any</option>
				{#each [1, 2, 3, 4, 5] as difficulty (difficulty)}
					<option value={difficulty}>{difficulty} / 5</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Tier</span>
			<select name="mapDifficulty" value={filters.mapDifficulty ?? ''}>
				<option value="">All</option>
				{#each ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as difficulty (difficulty)}
					<option value={difficulty}>{difficulty}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Version</span>
			<select name="version" value={filters.version ?? ''}>
				<option value="">All</option>
				{#each options.versions as version (version)}
					<option value={version}>v{version}</option>
				{/each}
			</select>
		</label>

		<noscript><button class="button" type="submit">Apply</button></noscript>
	</div>

	{#if chips.length > 0}
		<div class="chips" aria-label="Active filters">
			{#each chips as chip (chip.key)}
				<a class="chip" href={hrefWithout(chip.key)} data-sveltekit-noscroll>
					{chip.label} <span aria-hidden="true">×</span>
					<span class="sr-only">— remove filter</span>
				</a>
			{/each}
			<a class="clear" href="/strategies" data-sveltekit-noscroll>Clear all</a>
		</div>
	{/if}
</form>

<style>
	.filter-bar {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-card);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: end;
	}

	.search {
		display: flex;
		flex: 1 1 15rem;
		min-width: 13rem;
		align-items: center;
		gap: var(--space-1);
		padding: 0 var(--space-3);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--surface-raised);
		color: var(--fg-muted);
		transition: border-color 150ms ease;
	}

	.search:focus-within {
		border-color: var(--brand);
	}

	.search input {
		flex: 1;
		min-width: 0;
		min-height: var(--control-height);
		border: 0;
		background: transparent;
		color: var(--fg);
		font-size: var(--text-body);
		outline: none;
	}

	.search input::placeholder {
		color: var(--fg-muted);
	}

	.search kbd {
		padding: 0.05rem 0.4rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--fg-muted);
		font-family: var(--font-mono);
		font-size: var(--text-meta);
	}

	label:not(.search) {
		display: grid;
		gap: 0.25rem;
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	select {
		min-height: var(--control-height);
		padding: 0.55rem 2.25rem 0.55rem 0.8rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background-color: var(--surface-raised);
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23889486' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.6rem center;
		color: var(--fg);
		font: inherit;
		font-size: var(--text-meta);
		appearance: none;
		-webkit-appearance: none;
		transition: border-color 150ms ease;
	}

	select:hover,
	select:focus {
		border-color: var(--brand);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		align-items: center;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: var(--icon-control);
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--brand);
		border-radius: 999px;
		background: var(--brand-soft);
		color: var(--brand-strong);
		font-size: var(--text-meta);
		font-weight: 600;
		text-decoration: none;
		transition: background 150ms ease;
	}

	.chip:hover {
		background: color-mix(in srgb, var(--brand) 24%, var(--brand-soft));
	}

	.chip > span[aria-hidden] {
		opacity: 0.7;
	}

	.clear {
		display: inline-flex;
		min-height: var(--icon-control);
		align-items: center;
		margin-left: 0.25rem;
		color: var(--fg-muted);
		font-size: var(--text-meta);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (max-width: 40rem) {
		.filter-bar { padding: var(--space-3); }
		.search { flex-basis: 100%; }
		label:not(.search) { flex: 1 1 8rem; }
		select { width: 100%; }
	}
</style>
