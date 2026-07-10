<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import CompactStrategyCard from '$lib/components/public/CompactStrategyCard.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();

	const readyGuides = $derived(
		data.hero.guideCount === 1
			? m.ready_guides_one({ count: data.hero.guideCount })
			: m.ready_guides_other({ count: data.hero.guideCount })
	);
</script>

<svelte:head>
	<title>{m.hero_title({ name: data.hero.name })}</title>
	<meta name="description" content={m.hero_meta_description({ name: data.hero.name })} />
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={m.hero_title({ name: data.hero.name })} />
	<meta
		property="og:description"
		content={m.hero_og_description({ guides: readyGuides, name: data.hero.name })}
	/>
	<meta property="og:url" content={data.canonical} />
	<meta property="og:image" content={data.hero.iconUrl} />
</svelte:head>

<section class="profile-header page-shell">
	<a class="back" href={href('/heroes')}>{m.all_heroes_back()}</a>
	<div class="profile-grid">
		<EntityIcon src={data.hero.iconUrl} name={data.hero.name} />
		<div>
			<span>{m.hero_profile()}</span>
			<h1>{data.hero.name}</h1>
			<p>{data.hero.description ?? m.hero_default_description({ name: data.hero.name })}</p>
		</div>
		<div class="facts" aria-label={m.hero_coverage_label({ name: data.hero.name })}>
			<div><strong>{data.hero.guideCount}</strong><span>{m.facts_guides()}</span></div>
			<div><strong>{data.hero.maps.length}</strong><span>{m.facts_maps()}</span></div>
			<div><strong>{data.hero.modes.length}</strong><span>{m.facts_modes()}</span></div>
			<div><strong>{data.hero.versions.length}</strong><span>{m.facts_versions()}</span></div>
		</div>
	</div>
</section>

<section class="page-shell related-section">
	<div class="section-heading">
		<div>
			<h2>{m.ready_strategies()}</h2>
			<p>{m.hero_strategies_lead({ name: data.hero.name })}</p>
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
			title={m.empty_hero_title()}
			message={m.empty_hero_message({ name: data.hero.name })}
			href={href('/strategies')}
			linkLabel={m.browse_all_strategies()}
		/>
	{/if}
</section>

<section class="page-shell coverage-section">
	<div class="coverage-panel">
		<h2>{m.coverage_snapshot()}</h2>
		<div class="coverage-columns">
			<div>
				<h3>{m.facts_maps()}</h3>
				{#if data.hero.maps.length}
					<ul>{#each data.hero.maps as map}<li>{map.name}</li>{/each}</ul>
				{:else}<p>{m.none_yet()}</p>{/if}
			</div>
			<div>
				<h3>{m.facts_modes()}</h3>
				{#if data.hero.modes.length}
					<ul>{#each data.hero.modes as mode}<li>{mode.name}</li>{/each}</ul>
				{:else}<p>{m.none_yet()}</p>{/if}
			</div>
			<div>
				<h3>{m.facts_versions()}</h3>
				{#if data.hero.versions.length}
					<ul>{#each data.hero.versions as version}<li>v{version}</li>{/each}</ul>
				{:else}<p>{m.none_yet()}</p>{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.profile-header {
		padding-block: var(--space-5) 0;
	}

	.back {
		display: inline-flex;
		min-height: var(--icon-control);
		align-items: center;
		margin-bottom: var(--space-3);
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-weight: 750;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-4);
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	.profile-grid > div > span {
		color: var(--brand-strong);
		font-size: var(--text-meta);
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.2rem 0;
		font-size: clamp(2.5rem, 6vw, 4.25rem);
		letter-spacing: -0.065em;
	}

	.profile-grid p {
		max-width: 40rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: var(--text-lead);
		line-height: 1.6;
	}

	.facts {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: repeat(4, 1fr);
		margin: 0 -1.5rem -1.5rem;
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 62%, transparent);
	}

	.facts div {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-right: 1px solid var(--border);
	}

	.facts div:last-child { border-right: 0; }

	.facts strong {
		font-family: var(--font-mono);
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
	}

	.facts span {
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-weight: 650;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.related-section,
	.coverage-section {
		padding-top: var(--space-5);
	}

	.related-section .section-heading { margin-bottom: var(--space-3); }

	.strategy-rail {
		display: flex;
		gap: var(--space-3);
		overflow-x: auto;
		padding: 1px 1px 0.5rem;
		scroll-snap-type: x mandatory;
	}

	.coverage-section {
		padding-bottom: var(--space-4);
	}

	.coverage-panel {
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
	}

	.coverage-panel > h2 {
		margin: 0 0 var(--space-3);
		font-size: 1.75rem;
	}

	.coverage-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.coverage-columns h3 {
		margin: 0 0 0.35rem;
		font-size: var(--text-meta);
		text-transform: uppercase;
	}

	.coverage-columns ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		color: var(--fg-muted);
		list-style: none;
	}

	.coverage-columns li {
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: var(--text-meta);
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
