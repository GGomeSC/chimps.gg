<script lang="ts">
	import BuildOrder from '$lib/components/public/BuildOrder.svelte';
	import Breadcrumbs from '$lib/components/public/Breadcrumbs.svelte';
	import DifficultyPips from '$lib/components/public/DifficultyPips.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import StrategyMap from '$lib/components/StrategyMap.svelte';
	import { mapDifficultyLabel } from '$lib/labels';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
	// Writable $derived: user clicks override it, and it resets to the first
	// placement whenever `data.strategy` changes (client-side navigation).
	let selectedId: number | null = $derived(data.strategy.placements[0]?.id ?? null);
</script>

<svelte:head>
	<title>{data.strategy.title} · chimps.gg</title>
	<meta
		name="description"
		content={data.strategy.description ??
			m.detail_meta_description({
				map: data.strategy.map.name,
				mode: data.strategy.mode.name,
				version: data.strategy.verifiedVersion
			})}
	/>
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={`${data.strategy.title} · chimps.gg`} />
	<meta
		property="og:description"
		content={m.detail_og_description({ version: data.strategy.verifiedVersion })}
	/>
	<meta property="og:type" content="article" />
	<meta property="og:url" content={data.canonical} />
	{#if data.strategy.map.imageUrl}<meta property="og:image" content={data.strategy.map.imageUrl} />{/if}
</svelte:head>

<article class="strategy-detail">
	<header class="detail-header page-shell">
		<Breadcrumbs href={href('/strategies')} parent={m.nav_strategies()} current={data.strategy.title} />
		<div class="badges">
			<span>v{data.strategy.verifiedVersion}</span>
			<span>{data.strategy.mode.name}</span>
			{#if data.strategy.map.difficulty}<span>{m.map_badge({ difficulty: mapDifficultyLabel(data.strategy.map.difficulty) })}</span>{/if}
		</div>
		<h1>{data.strategy.title}</h1>
		<div class="summary-row">
			<div>
				<strong>{data.strategy.map.name}</strong>
				<small>{m.label_map()}</small>
			</div>
			<div class="hero-summary">
				{#if data.strategy.hero}
					<EntityIcon src={data.strategy.hero.iconUrl} name={data.strategy.hero.name} compact />
					<span><strong>{data.strategy.hero.name}</strong><small>{m.label_hero()}</small></span>
				{:else}
					<span><strong>{m.no_hero()}</strong><small>{m.label_hero()}</small></span>
				{/if}
			</div>
			<div>
				<DifficultyPips value={data.strategy.executionDifficulty} />
				<small>{m.execution_difficulty()}</small>
			</div>
		</div>
		{#if data.strategy.description}<p class="description">{data.strategy.description}</p>{/if}
		{#if data.strategy.sourceUrl}
			<a class="source" href={data.strategy.sourceUrl} target="_blank" rel="noopener noreferrer">
				{m.view_source()}
			</a>
		{/if}
	</header>

	<section class="content-grid page-shell">
		<div class="map-column" aria-labelledby="placement-heading">
			<div class="section-heading">
				<div>
					<div class="heading-title">
						<h2 id="placement-heading">{m.tower_placements()}</h2>
						<span class="guide">{m.guide_badge()}</span>
					</div>
				</div>
			</div>
			{#if data.strategy.placements.length > 0}
				<StrategyMap
					imageUrl={data.strategy.map.imageUrl}
					imageAlt={m.map_alt_placements({ map: data.strategy.map.name })}
					placements={data.strategy.placements}
					towers={data.strategy.towers}
					{selectedId}
					onselect={(id) => (selectedId = id)}
				/>
			{:else}
				<p class="notice">{m.no_layout_notice()}</p>
			{/if}
		</div>

		<div class="build-column" aria-labelledby="build-heading">
			<div class="section-heading">
				<div>
					<h2 id="build-heading">{m.build_order()}</h2>
				</div>
			</div>
			{#if data.strategy.steps.length > 0}
				<BuildOrder
					steps={data.strategy.steps}
					placements={data.strategy.placements}
					towers={data.strategy.towers}
				/>
			{:else}
				<p class="notice">{m.build_order_pending()}</p>
			{/if}
		</div>
	</section>

</article>

<style>
	.detail-header {
		padding-block: var(--space-5);
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.badges span,
	.guide {
		min-height: 2rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface-raised);
		font-size: var(--text-meta);
		font-weight: 800;
	}

	h1 {
		max-width: 55rem;
		margin: 0.8rem 0 1.5rem;
		font-size: var(--text-3xl);
		line-height: 0.98;
		letter-spacing: -0.065em;
	}

	.summary-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		padding: var(--space-3);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	.summary-row > div,
	.summary-row span {
		display: grid;
		gap: 0.15rem;
		align-content: center;
	}

	.summary-row > div {
		min-height: 3.5rem;
		padding-inline: var(--space-3);
		border-right: 1px solid var(--border);
	}

	.summary-row > div:last-child { border-right: 0; }

	.hero-summary {
		display: flex !important;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.5rem !important;
	}

	.summary-row small {
		color: var(--fg-muted);
		font-size: var(--text-meta);
	}

	.description {
		max-width: 48rem;
		margin: 1.5rem 0 0;
		color: var(--fg-muted);
		font-size: var(--text-lead);
		line-height: 1.7;
	}

	.source {
		display: inline-flex;
		min-height: var(--icon-control);
		align-items: center;
		margin-top: 1rem;
		font-weight: 800;
	}

	.content-grid {
		display: grid;
		grid-template-columns: minmax(0, 48rem) minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
		padding-block: var(--space-5) var(--space-4);
	}

	.map-column,
	.build-column {
		display: grid;
		gap: var(--space-3);
		align-content: start;
		min-width: 0;
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-card);
	}

	@media (min-width: 64.01rem) {
		.build-column { position: sticky; top: 5.5rem; max-height: calc(100vh - 7rem); overflow-y: auto; }
	}

	.content-grid .section-heading {
		align-items: start;
		min-height: 5rem;
		margin-bottom: 0;
	}

	.heading-title {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.heading-title h2 {
		margin: 0;
	}

	.guide {
		flex: none;
		background: var(--accent-soft);
		color: light-dark(#745200, #ffe28a);
	}

	.notice {
		padding: var(--space-3);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-md);
		color: var(--fg-muted);
	}

	@media (max-width: 64rem) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.content-grid .section-heading {
			min-height: 0;
		}
	}

	@media (max-width: 42rem) {
		.summary-row { grid-template-columns: 1fr; }
		.summary-row > div { border-right: 0; border-bottom: 1px solid var(--border); }
		.summary-row > div:last-child { border-bottom: 0; }
		.map-column, .build-column { padding: var(--space-3); }
	}
</style>
