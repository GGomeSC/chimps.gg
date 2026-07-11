<script lang="ts">
	import EmptyState from '$lib/components/public/EmptyState.svelte';
	import CompactStrategyCard from '$lib/components/public/CompactStrategyCard.svelte';
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	import { heroAccent } from '$lib/hero-accents';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
	const accent = $derived(heroAccent(data.hero.name));
	const hasQuickProfile = $derived(
		data.hero.baseCost !== null ||
			data.hero.attackStyle !== null ||
			data.hero.xpRatio !== null ||
			data.hero.synergies.length > 0
	);
	const levelingLabel = $derived.by(() => {
		if (data.hero.xpRatio === null) return null;
		if (data.hero.xpRatio <= 1) return m.hero_leveling_fast();
		if (data.hero.xpRatio < 1.5) return m.hero_leveling_moderate();
		return m.hero_leveling_slow();
	});
	const formattedBaseCost = $derived(
		data.hero.baseCost === null
			? null
			: new Intl.NumberFormat(data.locale).format(data.hero.baseCost)
	);
	const formattedXpRatio = $derived(
		data.hero.xpRatio === null
			? null
			: new Intl.NumberFormat(data.locale, { maximumFractionDigits: 3 }).format(data.hero.xpRatio)
	);

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
	<div class:has-quick={hasQuickProfile} class="profile-grid" style:--hero-accent={accent}>
		<div class="portrait">
			<EntityIcon src={data.hero.iconUrl} name={data.hero.name} profile />
		</div>
		<div class="identity">
			<span>{m.hero_profile()}</span>
			<h1>{data.hero.name}</h1>
			<p class="summary">{data.hero.description ?? m.hero_default_description({ name: data.hero.name })}</p>
			{#if data.hero.technicalDescription || data.hero.profileSourceUrl}
				<div class="technical">
					{#if data.hero.technicalDescription}<p>{data.hero.technicalDescription}</p>{/if}
					{#if data.hero.profileSourceUrl}
						<a href={data.hero.profileSourceUrl} target="_blank" rel="external noreferrer">
							{m.hero_source_link()}
						</a>
					{/if}
				</div>
			{/if}
		</div>
		{#if hasQuickProfile}
			<aside class="quick-profile">
				{#if data.hero.baseCost !== null && formattedBaseCost}
					<div class="quick-fact">
						<span>{m.hero_base_cost()}</span>
						<strong>${formattedBaseCost}</strong>
					</div>
				{/if}
				{#if data.hero.attackStyle}
					<div class="quick-fact">
						<span>{m.hero_attack_style()}</span>
						<strong>{data.hero.attackStyle}</strong>
					</div>
				{/if}
				{#if data.hero.xpRatio !== null && levelingLabel && formattedXpRatio}
					<div class="quick-fact">
						<span>{m.hero_leveling()}</span>
						<strong>{levelingLabel}</strong>
						<small>{m.hero_xp_ratio({ ratio: formattedXpRatio })}</small>
					</div>
				{/if}
				{#if data.hero.synergies.length > 0}
					<div class="synergies">
						<span>{m.hero_synergies()}</span>
						<ul>
							{#each data.hero.synergies as tower (tower.id)}
								<li class:described={tower.description !== null}>
									<strong>{tower.name}</strong>
									{#if tower.description}<small>{tower.description}</small>{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</aside>
		{/if}
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
		isolation: isolate;
		position: relative;
		display: grid;
		grid-template-columns: minmax(10rem, 15rem) minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	.profile-grid::before {
		position: absolute;
		z-index: 0;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
		background:
			radial-gradient(circle at 8% 30%, color-mix(in srgb, var(--hero-accent) 25%, transparent), transparent 35%),
			linear-gradient(115deg, color-mix(in srgb, var(--hero-accent) 8%, var(--surface-raised)), var(--surface-raised) 65%);
		content: '';
	}

	.profile-grid > * {
		position: relative;
		z-index: 1;
	}

	.profile-grid.has-quick {
		grid-template-columns: minmax(10rem, 15rem) minmax(0, 1fr) minmax(15rem, 19rem);
	}

	.portrait {
		align-self: end;
		margin-top: calc(var(--space-5) * -1);
		margin-bottom: calc(var(--space-2) * -1);
	}

	.identity { align-self: center; }

	.identity > span {
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

	.summary {
		max-width: 40rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: var(--text-lead);
		line-height: 1.6;
	}

	.technical {
		max-width: 46rem;
		padding-top: var(--space-3);
		margin-top: var(--space-3);
		border-top: 1px solid color-mix(in srgb, var(--hero-accent) 24%, var(--border));
	}

	.technical p {
		margin: 0;
		color: var(--fg-muted);
		line-height: 1.65;
		white-space: pre-line;
	}

	.technical a {
		display: inline-flex;
		margin-top: var(--space-2);
		color: color-mix(in srgb, var(--hero-accent) 72%, var(--fg));
		font-size: var(--text-meta);
		font-weight: 750;
	}

	.quick-profile {
		display: grid;
		align-self: stretch;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid color-mix(in srgb, var(--hero-accent) 28%, var(--border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--surface) 76%, transparent);
	}

	.quick-fact {
		display: grid;
		gap: 0.15rem;
	}

	.quick-fact span,
	.synergies > span {
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-weight: 750;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.quick-fact strong { font-size: 1.05rem; }
	.quick-fact small { color: var(--fg-muted); }

	.synergies ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin: var(--space-1) 0 0;
		padding: 0;
		list-style: none;
	}

	.synergies li {
		padding: 0.3rem 0.55rem;
		border: 1px solid color-mix(in srgb, var(--hero-accent) 28%, var(--border));
		border-radius: 999px;
		background: color-mix(in srgb, var(--hero-accent) 9%, var(--surface));
		font-size: var(--text-meta);
	}

	.synergies li.described {
		display: grid;
		flex-basis: 100%;
		gap: 0.15rem;
		border-radius: var(--radius-sm);
	}

	.synergies li small {
		color: var(--fg-muted);
		line-height: 1.45;
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

	@media (max-width: 68rem) {
		.profile-grid.has-quick {
			grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr);
		}

		.quick-profile {
			grid-column: 1 / -1;
			grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		}
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

		.profile-grid.has-quick { grid-template-columns: 1fr; }

		.portrait {
			justify-self: center;
			margin-top: calc(var(--space-4) * -1);
			margin-bottom: calc(var(--space-3) * -1);
		}

		.identity { text-align: center; }
		.technical { text-align: left; }
		.quick-profile { grid-column: auto; grid-template-columns: 1fr; }

		.coverage-columns {
			grid-template-columns: 1fr;
		}

		.facts { grid-column: auto; }
	}
</style>
