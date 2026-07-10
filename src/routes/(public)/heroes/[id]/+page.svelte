<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';

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
			<p>
				Coverage below is derived only from ready, versioned chimps.gg strategies. It is not a
				performance ranking.
			</p>
		</div>
	</div>
</section>

<section class="facts page-shell" aria-label={`${data.hero.name} guide coverage`}>
	<div><strong>{data.hero.guideCount}</strong><span>Ready guides</span></div>
	<div><strong>{data.hero.maps.length}</strong><span>Covered maps</span></div>
	<div><strong>{data.hero.modes.length}</strong><span>Covered modes</span></div>
	<div><strong>{data.hero.versions.length}</strong><span>Verified versions</span></div>
</section>

<section class="page-shell related-section">
	<div class="section-heading">
		<div>
			<h2>Ready strategies</h2>
			<p>Curated build orders that explicitly use {data.hero.name}.</p>
		</div>
	</div>
	{#if data.hero.strategies.length > 0}
		<div class="strategy-grid">
			{#each data.hero.strategies as strategy (strategy.id)}
				<StrategyCard {strategy} />
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
	<div class="analytics-panel">
		<span>Community data coming soon</span>
		<h2>No pretend performance stats.</h2>
		<p>
			Win rates, bloon matchups, map performance, and popularity are unavailable until
			chimps.gg has a trustworthy, consented community-data pipeline.
		</p>
	</div>
</section>

<style>
	.profile-header {
		padding-block: clamp(3rem, 8vw, 5rem) 2rem;
	}

	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: var(--fg-muted);
		font-weight: 750;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 1.5rem;
		align-items: center;
	}

	.profile-grid > div > span,
	.analytics-panel > span {
		color: var(--brand-strong);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.2rem 0;
		font-size: clamp(2.7rem, 8vw, 5rem);
		letter-spacing: -0.065em;
	}

	.profile-grid p {
		max-width: 44rem;
		margin: 0;
		color: var(--fg-muted);
		line-height: 1.6;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	.facts div {
		display: grid;
		gap: 0.2rem;
		padding: 1.25rem;
		border-right: 1px solid var(--border);
	}

	.facts div:last-child {
		border: 0;
	}

	.facts strong {
		font-size: 1.65rem;
	}

	.facts span {
		color: var(--fg-muted);
		font-size: 0.75rem;
	}

	.related-section,
	.coverage-section {
		padding-top: clamp(3rem, 8vw, 6rem);
	}

	.coverage-section {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
		gap: 1rem;
	}

	.coverage-panel,
	.analytics-panel {
		padding: clamp(1.25rem, 4vw, 2rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
	}

	.coverage-panel > h2,
	.analytics-panel h2 {
		margin-top: 0;
	}

	.coverage-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.coverage-columns h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	.coverage-columns ul {
		margin: 0;
		padding-left: 1.1rem;
		color: var(--fg-muted);
	}

	.coverage-columns p,
	.analytics-panel p {
		color: var(--fg-muted);
		line-height: 1.6;
	}

	.analytics-panel {
		background: linear-gradient(145deg, var(--surface-raised), var(--brand-soft));
	}

	.analytics-panel h2 {
		margin: 0.5rem 0;
	}

	@media (max-width: 45rem) {
		.facts {
			grid-template-columns: repeat(2, 1fr);
		}

		.facts div:nth-child(2) {
			border-right: 0;
		}

		.facts div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--border);
		}

		.coverage-section {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 32rem) {
		.profile-grid {
			grid-template-columns: 1fr;
			align-items: start;
		}

		.coverage-columns {
			grid-template-columns: 1fr;
		}
	}
</style>
