<script lang="ts">
	import BuildOrder from '$lib/components/public/BuildOrder.svelte';
	import DifficultyPips from '$lib/components/public/DifficultyPips.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import PlacementLegend from '$lib/components/public/PlacementLegend.svelte';
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

	<section class="map-section page-shell" aria-labelledby="placement-heading">
		<div class="section-heading">
			<div>
				<h2 id="placement-heading">Approximate tower placements</h2>
				<p>
					Markers use normalized coordinates on current map-select art. Treat them as a visual
					reference, not pixel-perfect placement instructions.
				</p>
			</div>
			<span class="approximate">Approximate guide</span>
		</div>
		{#if data.strategy.placements.length > 0}
			<div class="map-layout">
				<StrategyMap
					imageUrl={data.strategy.map.imageUrl}
					imageAlt={`${data.strategy.map.name} map with approximate tower placements`}
					placements={data.strategy.placements}
					towers={data.strategy.towers}
					{selectedId}
					onselect={(id) => (selectedId = id)}
				/>
				<PlacementLegend
					placements={data.strategy.placements}
					towers={data.strategy.towers}
					{selectedId}
					onselect={(id) => (selectedId = id)}
				/>
			</div>
		{:else}
			<p class="notice">This guide does not have a visual layout yet.</p>
		{/if}
	</section>

	<section class="build-section page-shell" aria-labelledby="build-heading">
		<div class="section-heading">
			<div>
				<h2 id="build-heading">Build order</h2>
				<p>Follow the curator’s stored order; steps are not automatically sorted by round.</p>
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
	</section>

	<section class="provenance page-shell">
		<div><strong>Curated</strong><span>Strategy, placements, and steps are authored in chimps.gg Studio.</span></div>
		<div><strong>Official API</strong><span>Map identity and available map art are sourced from Ninja Kiwi metadata.</span></div>
		<div><strong>Verified</strong><span>Last checked against game version {data.strategy.verifiedVersion}.</span></div>
	</section>
</article>

<style>
	.detail-header {
		padding-block: clamp(3rem, 8vw, 6rem);
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
	.approximate {
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

	.map-section,
	.build-section {
		padding-top: clamp(3rem, 8vw, 6rem);
	}

	.approximate {
		flex: none;
		background: var(--accent-soft);
		color: light-dark(#745200, #ffe28a);
	}

	.map-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(14rem, 20rem);
		gap: 1rem;
		align-items: start;
	}

	.notice {
		padding: 1rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-md);
		color: var(--fg-muted);
	}

	.build-section {
		max-width: 54rem;
	}

	.provenance {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-top: clamp(3rem, 8vw, 6rem);
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.provenance div {
		display: grid;
		gap: 0.3rem;
	}

	.provenance span {
		color: var(--fg-muted);
		font-size: 0.8rem;
		line-height: 1.45;
	}

	@media (max-width: 48rem) {
		.map-layout,
		.provenance {
			grid-template-columns: 1fr;
		}
	}
</style>
