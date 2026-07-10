<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import CompactStrategyCard from '$lib/components/public/CompactStrategyCard.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.hero.name} strategies · chimps.gg</title>
	<meta
		name="description"
		content={`Explore ${data.hero.name} strategies, maps, modes, and verified game versions curated on chimps.gg.`}
	/>
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={`${data.hero.name} strategies · chimps.gg`} />
	<meta
		property="og:description"
		content={`${data.hero.guideCount} ready ${data.hero.name} ${data.hero.guideCount === 1 ? 'guide' : 'guides'} with factual coverage data.`}
	/>
	<meta property="og:url" content={data.canonical} />
	<meta property="og:image" content={data.hero.iconUrl} />
</svelte:head>

<section class="profile-header page-shell">
	<a class="back" href="/heroes">← All heroes</a>
	<div class="profile-grid">
		<EntityIcon src={data.hero.iconUrl} name={data.hero.name} />
		<div>
			<span>Hero profile</span>
			<h1>{data.hero.name}</h1>
			<p>{data.hero.description ?? `${data.hero.name} is ready to lead your next Bloons TD 6 strategy.`}</p>
		</div>
		<div class="facts" aria-label={`${data.hero.name} guide coverage`}>
			<div><strong>{data.hero.guideCount}</strong><span>Guides</span></div>
			<div><strong>{data.hero.maps.length}</strong><span>Maps</span></div>
			<div><strong>{data.hero.modes.length}</strong><span>Modes</span></div>
			<div><strong>{data.hero.versions.length}</strong><span>Versions</span></div>
		</div>
	</div>
</section>

<section class="page-shell related-section">
	<div class="section-heading">
		<div>
			<h2>Ready strategies</h2>
			<p>Curated build orders that explicitly use {data.hero.name}.</p>
		</div>
	</div>
	{#if data.hero.strategies.length > 0}
		<div class="strategy-rail">
			{#each data.hero.strategies as strategy (strategy.id)}
				<CompactStrategyCard {strategy} />
			{/each}
		</div>
	{:else}
		<EmptyState
			title="No ready guide yet"
			message={`A ${data.hero.name} strategy has not been marked ready for public use yet.`}
			href="/strategies"
			linkLabel="Browse all strategies"
		/>
	{/if}
</section>

<section class="page-shell coverage-section">
	<div class="coverage-panel">
		<h2>Coverage snapshot</h2>
		<div class="coverage-columns">
			<div>
				<h3>Maps</h3>
				{#if data.hero.maps.length}
					<ul>{#each data.hero.maps as map}<li>{map.name}</li>{/each}</ul>
				{:else}<p>None yet</p>{/if}
			</div>
			<div>
				<h3>Modes</h3>
				{#if data.hero.modes.length}
					<ul>{#each data.hero.modes as mode}<li>{mode.name}</li>{/each}</ul>
				{:else}<p>None yet</p>{/if}
			</div>
			<div>
				<h3>Versions</h3>
				{#if data.hero.versions.length}
					<ul>{#each data.hero.versions as version}<li>v{version}</li>{/each}</ul>
				{:else}<p>None yet</p>{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.profile-header {
		padding-block: clamp(1.25rem, 3vw, 2rem) 0;
	}

	.back {
		display: inline-block;
		margin-bottom: 0.85rem;
		color: var(--fg-muted);
		font-weight: 750;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 1.25rem;
		align-items: center;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	.profile-grid > div > span {
		color: var(--brand-strong);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.2rem 0;
		font-size: clamp(2.35rem, 6vw, 4rem);
		letter-spacing: -0.065em;
	}

	.profile-grid p {
		max-width: 40rem;
		margin: 0;
		color: var(--fg-muted);
		line-height: 1.5;
	}

	.facts {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: repeat(4, 1fr);
		margin: 0.15rem -1rem -1rem;
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 62%, transparent);
	}

	.facts div {
		display: grid;
		gap: 0.2rem;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		gap: 0.55rem;
		padding: 0.7rem 1rem;
		border-right: 1px solid var(--border);
	}

	.facts div:last-child { border-right: 0; }

	.facts strong {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
	}

	.facts span {
		color: var(--fg-muted);
		font-size: 0.75rem;
		font-weight: 650;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.related-section,
	.coverage-section {
		padding-top: clamp(1.5rem, 3vw, 2.25rem);
	}

	.related-section .section-heading { margin-bottom: 0.75rem; }
	.related-section .section-heading h2 { font-size: clamp(1.4rem, 3vw, 1.8rem); }
	.related-section .section-heading p { font-size: 0.85rem; }

	.strategy-rail {
		display: flex;
		gap: 0.7rem;
		overflow-x: auto;
		padding: 1px 1px 0.5rem;
		scroll-snap-type: x mandatory;
	}

	.coverage-section {
		padding-bottom: clamp(1.5rem, 4vw, 3rem);
	}

	.coverage-panel {
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
	}

	.coverage-panel > h2 {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
	}

	.coverage-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.coverage-columns h3 {
		margin: 0 0 0.35rem;
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	.coverage-columns ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		color: var(--fg-muted);
		list-style: none;
	}

	.coverage-columns li {
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.72rem;
	}

	.coverage-columns p { margin: 0; color: var(--fg-muted); }

	@media (max-width: 60rem) {
		.profile-grid { grid-template-columns: auto minmax(0, 1fr); }
	}

	@media (max-width: 45rem) {
		.facts { grid-template-columns: repeat(2, 1fr); }
		.facts div:nth-child(2) { border-right: 0; }
		.facts div:nth-child(-n + 2) { border-bottom: 1px solid var(--border); }
	}

	@media (max-width: 32rem) {
		.profile-grid {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.coverage-columns {
			grid-template-columns: 1fr;
		}

		.facts { grid-column: auto; }
	}
</style>
