<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import FilterBar from '$lib/components/public/FilterBar.svelte';
	import PageIntro from '$lib/components/public/PageIntro.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';
	import { fuzzyMatch } from '$lib/fuzzy';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

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
	<title>{m.strategies_title()}</title>
	<meta name="description" content={m.strategies_meta_description()} />
	<link rel="canonical" href={data.canonical} />
	{#if data.filtered}<meta name="robots" content="noindex,follow" />{/if}
	<meta property="og:title" content={m.strategies_og_title()} />
	<meta property="og:description" content={m.strategies_og_description()} />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<div class="page-shell discovery">
	<PageIntro
		title={m.find_your_next_run()}
	/>
	<FilterBar filters={data.filters} options={data.options} bind:query />

	<section class="results" aria-label={m.strategy_results()}>
		{#if visible.length > 0}
			<div class="strategy-grid">
				{#each visible as strategy (strategy.id)}
					<StrategyCard {strategy} />
				{/each}
			</div>
			{#if data.nextHref && !query.trim()}
				<div class="pagination">
					<a class="button secondary" href={data.nextHref}>{m.next_strategies()}</a>
				</div>
			{/if}
		{:else}
			<EmptyState
				title={m.empty_results_title()}
				message={m.empty_results_message()}
				href={href('/strategies')}
				linkLabel={m.clear_filters()}
			/>
		{/if}
	</section>
</div>

<style>
	.discovery {
		display: grid;
		gap: var(--space-4);
		padding-block: var(--space-5) var(--space-4);
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: var(--space-5);
	}
</style>
