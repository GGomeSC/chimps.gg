<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import FilterBar from '$lib/components/public/FilterBar.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';
	import { fuzzyMatch } from '$lib/fuzzy';

	let { data } = $props();

	let query = $state('');

	// Fuzzy search narrows the loaded page client-side; server filters own the URL.
	const visible = $derived(
		query.trim()
			? data.strategies.filter((strategy) =>
					fuzzyMatch(
						query,
						`${strategy.title} ${strategy.map.name} ${strategy.mode.name} ${strategy.hero?.name ?? ''}`
					)
				)
			: data.strategies
	);
</script>

<svelte:head>
	<title>Browse Bloons TD 6 strategies · chimps.gg</title>
	<meta
		name="description"
		content="Filter ready Bloons TD 6 strategy guides by map, mode, hero, execution difficulty, map difficulty, and verified version."
	/>
	<link rel="canonical" href={data.canonical} />
	{#if data.filtered}<meta name="robots" content="noindex,follow" />{/if}
	<meta property="og:title" content="Browse BTD6 strategies · chimps.gg" />
	<meta property="og:description" content="Find a versioned, community-curated strategy for your next run." />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<div class="page-shell discovery">
	<FilterBar filters={data.filters} options={data.options} bind:query />

	<section class="results" aria-label="Strategy results">
		{#if visible.length > 0}
			<div class="strategy-grid">
				{#each visible as strategy (strategy.id)}
					<StrategyCard {strategy} />
				{/each}
			</div>
			{#if data.nextHref && !query.trim()}
				<div class="pagination">
					<a class="button secondary" href={data.nextHref}>Next strategies →</a>
				</div>
			{/if}
		{:else}
			<EmptyState
				title="No ready strategy matches that setup"
				message="Try removing one filter or browse everything that has been verified for public use."
				href="/strategies"
				linkLabel="Clear filters"
			/>
		{/if}
	</section>
</div>

<style>
	.discovery {
		display: grid;
		gap: 1.75rem;
		padding-top: clamp(1.5rem, 4vw, 2.5rem);
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}
</style>
