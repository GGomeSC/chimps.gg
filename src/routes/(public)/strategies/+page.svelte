<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import FilterPanel from '$lib/components/public/FilterPanel.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';

	let { data } = $props();
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

<section class="page-heading page-shell">
	<span>Strategy library</span>
	<h1>Find your next clear.</h1>
	<p>Every result is marked ready by a curator and tied to a verified game version.</p>
</section>

<div class="page-shell discovery-layout">
	<aside>
		<FilterPanel filters={data.filters} options={data.options} />
	</aside>
	<section class="results" aria-labelledby="result-heading">
		<div class="result-heading">
			<div>
				<span>Ready guides</span>
				<h2 id="result-heading">
					{data.totalCount} {data.totalCount === 1 ? 'strategy' : 'strategies'}
				</h2>
			</div>
			<small>Newest first</small>
		</div>

		{#if data.strategies.length > 0}
			<div class="strategy-grid result-grid">
				{#each data.strategies as strategy (strategy.id)}
					<StrategyCard {strategy} />
				{/each}
			</div>
			{#if data.nextHref}
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
	.page-heading {
		padding-block: clamp(3rem, 7vw, 5rem) 2rem;
	}

	.page-heading > span,
	.result-heading span {
		color: var(--brand-strong);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.35rem 0;
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		letter-spacing: -0.065em;
	}

	.page-heading p {
		max-width: 42rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: 1.05rem;
	}

	.discovery-layout {
		display: grid;
		grid-template-columns: minmax(16rem, 19rem) minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
	}

	aside {
		position: sticky;
		top: 5.5rem;
	}

	.result-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.result-heading h2 {
		margin: 0.1rem 0 0;
		font-size: 1.5rem;
	}

	.result-heading small {
		color: var(--fg-muted);
	}

	.result-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	@media (max-width: 52rem) {
		.discovery-layout {
			grid-template-columns: 1fr;
		}

		aside {
			position: static;
		}
	}

	@media (max-width: 34rem) {
		.result-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
