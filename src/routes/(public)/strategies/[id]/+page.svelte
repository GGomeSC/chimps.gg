<script lang="ts">
	import BuildOrder from '$lib/components/public/BuildOrder.svelte';
	import DifficultyPips from '$lib/components/public/DifficultyPips.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import StrategyMap from '$lib/components/StrategyMap.svelte';

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
			`${data.strategy.map.name} ${data.strategy.mode.name} strategy verified for BTD6 ${data.strategy.verifiedVersion}.`}
	/>
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={`${data.strategy.title} · chimps.gg`} />
	<meta
		property="og:description"
		content={`Visual placements and build order verified on BTD6 ${data.strategy.verifiedVersion}.`}
	/>
	<meta property="og:type" content="article" />
	<meta property="og:url" content={data.canonical} />
	{#if data.strategy.map.imageUrl}<meta property="og:image" content={data.strategy.map.imageUrl} />{/if}
</svelte:head>

<article class="strategy-detail">
	<header class="detail-header page-shell">
		<a class="back" href="/strategies">← All strategies</a>
		<div class="badges">
			<span>v{data.strategy.verifiedVersion}</span>
			<span>{data.strategy.mode.name}</span>
			{#if data.strategy.map.difficulty}<span>{data.strategy.map.difficulty} map</span>{/if}
		</div>
		<h1>{data.strategy.title}</h1>
		<div class="summary-row">
			<div>
				<strong>{data.strategy.map.name}</strong>
				<small>Map</small>
			</div>
			<div class="hero-summary">
				{#if data.strategy.hero}
					<EntityIcon src={data.strategy.hero.iconUrl} name={data.strategy.hero.name} compact />
					<span><strong>{data.strategy.hero.name}</strong><small>Hero</small></span>
				{:else}
					<span><strong>No hero</strong><small>Hero</small></span>
				{/if}
			</div>
			<div>
				<DifficultyPips value={data.strategy.executionDifficulty} />
				<small>Execution difficulty</small>
			</div>
		</div>
		{#if data.strategy.description}<p class="description">{data.strategy.description}</p>{/if}
		{#if data.strategy.sourceUrl}
			<a class="source" href={data.strategy.sourceUrl} target="_blank" rel="noopener noreferrer">
				View original source ↗
			</a>
		{/if}
	</header>

	<section class="content-grid page-shell">
		<div class="map-column" aria-labelledby="placement-heading">
			<div class="section-heading">
				<div>
					<div class="heading-title">
						<h2 id="placement-heading">Tower placements</h2>
						<span class="guide">Guide</span>
					</div>
					<p>
						Treat them as a visual reference, not pixel-perfect placement instructions.
					</p>
				</div>
			</div>
			{#if data.strategy.placements.length > 0}
				<StrategyMap
					imageUrl={data.strategy.map.imageUrl}
					imageAlt={`${data.strategy.map.name} map with approximate tower placements`}
					placements={data.strategy.placements}
					towers={data.strategy.towers}
					{selectedId}
					onselect={(id) => (selectedId = id)}
				/>
			{:else}
				<p class="notice">This guide does not have a visual layout yet.</p>
			{/if}
		</div>

		<div class="build-column" aria-labelledby="build-heading">
			<div class="section-heading">
				<div>
					<h2 id="build-heading">Build order</h2>
					<p>Follow the rounds and actions in sequence during your run.</p>
				</div>
			</div>
			{#if data.strategy.steps.length > 0}
				<BuildOrder
					steps={data.strategy.steps}
					placements={data.strategy.placements}
					towers={data.strategy.towers}
				/>
			{:else}
				<p class="notice">The build order is still being documented.</p>
			{/if}
		</div>
	</section>

</article>

<style>
	.detail-header {
		padding-block: clamp(1.5rem, 4vw, 2.75rem);
	}

	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: var(--fg-muted);
		font-weight: 750;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.badges span,
	.guide {
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface-raised);
		font-size: 0.75rem;
		font-weight: 800;
	}

	h1 {
		max-width: 55rem;
		margin: 0.8rem 0 1.5rem;
		font-size: clamp(2.5rem, 8vw, 5rem);
		line-height: 0.98;
		letter-spacing: -0.065em;
	}

	.summary-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2.5rem;
		padding-block: 1rem;
		border-block: 1px solid var(--border);
	}

	.summary-row > div,
	.summary-row span {
		display: grid;
		gap: 0.15rem;
		align-content: center;
	}

	.hero-summary {
		display: flex !important;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.5rem !important;
	}

	.summary-row small {
		color: var(--fg-muted);
		font-size: 0.72rem;
	}

	.description {
		max-width: 48rem;
		margin: 1.5rem 0 0;
		color: var(--fg-muted);
		font-size: 1.08rem;
		line-height: 1.7;
	}

	.source {
		display: inline-block;
		margin-top: 1rem;
		font-weight: 800;
	}

	.content-grid {
		display: grid;
		grid-template-columns: minmax(0, 48rem) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 3rem);
		align-items: start;
		padding-top: clamp(1.5rem, 4vw, 3rem);
	}

	.map-column,
	.build-column {
		display: grid;
		gap: 1rem;
		align-content: start;
		min-width: 0;
	}

	.content-grid .section-heading {
		align-items: start;
		min-height: 4.25rem;
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

	.content-grid .section-heading p {
		margin-top: 0.35rem;
	}

	.guide {
		flex: none;
		background: var(--accent-soft);
		color: light-dark(#745200, #ffe28a);
	}

	.notice {
		padding: 1rem;
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
</style>
