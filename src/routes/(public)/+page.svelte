<script lang="ts">
	import HeroCard from '$lib/components/public/HeroCard.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>chimps.gg · Bloons TD 6 strategies that are ready to run</title>
	<meta
		name="description"
		content="Discover community-curated Bloons TD 6 strategies with verified versions, visual placements, and round-by-round build orders."
	/>
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content="chimps.gg · Bloons TD 6 strategy guides" />
	<meta
		property="og:description"
		content="Clear, versioned BTD6 strategies with visual placements and build orders."
	/>
	<meta property="og:url" content={data.canonical} />
	<meta property="og:type" content="website" />
</svelte:head>

<section class="hero page-shell">
	<div class="hero-copy">
		<span class="kicker">Community strategy platform</span>
		<h1>Plan the run.<br /><span>Pop the doubt.</span></h1>
		<p>
			Version-aware Bloons TD 6 guides with visual tower placements and a clear build order
			for every round that matters.
		</p>
		<div class="hero-actions">
			<a class="button" href="/strategies">Find a strategy <span aria-hidden="true">→</span></a>
			<a class="button secondary" href="/heroes">Explore heroes</a>
		</div>
		<ul class="trust-list" aria-label="Platform promises">
			<li><span aria-hidden="true">✓</span> Ready guides only</li>
			<li><span aria-hidden="true">✓</span> Verified game versions</li>
			<li><span aria-hidden="true">✓</span> Honest data labels</li>
		</ul>
	</div>
	<div class="hero-art" aria-hidden="true">
		<div class="orbit orbit-one"></div>
		<div class="orbit orbit-two"></div>
		<div class="target">
			<span>R100</span>
			<strong>READY</strong>
		</div>
		<div class="bloon bloon-one"></div>
		<div class="bloon bloon-two"></div>
		<div class="bloon bloon-three"></div>
	</div>
</section>

<section class="provenance-strip">
	<div class="page-shell provenance-grid">
		<div><strong>Official map art</strong><span>Synced from Ninja Kiwi metadata</span></div>
		<div><strong>Curated playbooks</strong><span>Authored and reviewed in Studio</span></div>
		<div><strong>Version provenance</strong><span>Every ready guide names its verified version</span></div>
	</div>
</section>

<section class="content-section page-shell">
	<div class="section-heading">
		<div>
			<h2>Latest ready strategies</h2>
			<p>Structured guides you can open on a second screen and follow without guesswork.</p>
		</div>
		<a href="/strategies">Browse all →</a>
	</div>
	{#if data.strategies.length > 0}
		<div class="strategy-grid">
			{#each data.strategies as strategy (strategy.id)}
				<StrategyCard {strategy} />
			{/each}
		</div>
	{:else}
		<p class="quiet">The first public strategies are being prepared in Studio.</p>
	{/if}
</section>

<section class="content-section page-shell">
	<div class="section-heading">
		<div>
			<h2>Start with a hero</h2>
			<p>See where each hero appears across ready maps, modes, and verified versions.</p>
		</div>
		<a href="/heroes">Meet every hero →</a>
	</div>
	<div class="hero-grid">
		{#each data.heroes as hero (hero.id)}
			<HeroCard {hero} />
		{/each}
	</div>
</section>

<section class="analytics-callout page-shell">
	<div>
		<span class="kicker">Next layer</span>
		<h2>Community analytics—when the data is real.</h2>
		<p>
			Hero win rates, matchups, popularity, and map performance need trustworthy community
			play data. We will show them after a consented data pipeline exists, not before.
		</p>
	</div>
	<span class="coming-soon">Community data coming soon</span>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(18rem, 0.95fr);
		gap: clamp(2rem, 7vw, 6rem);
		align-items: center;
		min-height: min(46rem, calc(100vh - 4.5rem));
		padding-block: clamp(4rem, 9vw, 7rem);
	}

	.kicker {
		color: var(--brand-strong);
		font-size: 0.78rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.6rem 0 1rem;
		font-size: clamp(3.2rem, 9vw, 6.6rem);
		line-height: 0.88;
		letter-spacing: -0.08em;
	}

	h1 span {
		color: var(--brand-strong);
	}

	.hero-copy > p {
		max-width: 37rem;
		color: var(--fg-muted);
		font-size: clamp(1rem, 2vw, 1.2rem);
		line-height: 1.65;
	}

	.hero-actions,
	.trust-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.hero-actions {
		margin-top: 1.5rem;
	}

	.trust-list {
		margin: 2rem 0 0;
		padding: 0;
		color: var(--fg-muted);
		font-size: 0.78rem;
		font-weight: 700;
		list-style: none;
	}

	.trust-list li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.trust-list span {
		display: grid;
		width: 1.2rem;
		height: 1.2rem;
		place-items: center;
		border-radius: 50%;
		background: var(--brand-soft);
		color: var(--brand-strong);
	}

	.hero-art {
		position: relative;
		aspect-ratio: 1;
		border: 1px solid var(--border);
		border-radius: 48% 52% 42% 58% / 55% 40% 60% 45%;
		background:
			radial-gradient(circle at 50% 52%, var(--accent) 0 4%, transparent 4.5%),
			repeating-radial-gradient(circle, transparent 0 12%, color-mix(in srgb, var(--fg) 7%, transparent) 12.5% 13%),
			linear-gradient(145deg, var(--brand-soft), var(--surface));
		box-shadow: var(--shadow-card-hover);
	}

	.target {
		position: absolute;
		top: 50%;
		left: 50%;
		display: grid;
		width: 8rem;
		aspect-ratio: 1;
		transform: translate(-50%, -50%) rotate(-4deg);
		place-content: center;
		border: 0.55rem solid var(--surface-raised);
		border-radius: 50%;
		background: var(--ink);
		color: #fff;
		text-align: center;
		box-shadow: 0 8px 0 color-mix(in srgb, var(--ink) 45%, transparent);
	}

	.target span {
		font-size: 1.65rem;
		font-weight: 950;
	}

	.target strong {
		color: var(--brand);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
	}

	.bloon {
		position: absolute;
		width: 2.2rem;
		height: 2.7rem;
		border: 3px solid var(--ink);
		border-radius: 50% 50% 46% 46%;
		background: #ff5c63;
		box-shadow: inset -6px -5px 0 rgb(0 0 0 / 0.12);
	}

	.bloon::after {
		position: absolute;
		bottom: -0.55rem;
		left: 50%;
		width: 0.65rem;
		height: 0.65rem;
		transform: translateX(-50%) rotate(45deg);
		border-right: 3px solid var(--ink);
		border-bottom: 3px solid var(--ink);
		background: inherit;
		content: '';
	}

	.bloon-one { top: 14%; left: 18%; transform: rotate(-14deg); }
	.bloon-two { right: 13%; bottom: 22%; transform: rotate(12deg); background: #65b8ff; }
	.bloon-three { right: 18%; top: 18%; transform: scale(0.72) rotate(8deg); background: #b383f8; }

	.provenance-strip {
		border-block: 1px solid var(--border);
		background: var(--surface);
	}

	.provenance-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
	}

	.provenance-grid div {
		display: grid;
		gap: 0.25rem;
		padding: 1.35rem;
		text-align: center;
	}

	.provenance-grid span {
		color: var(--fg-muted);
		font-size: 0.75rem;
	}

	.content-section {
		padding-top: clamp(4rem, 9vw, 7rem);
	}

	.quiet {
		padding: 2rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		color: var(--fg-muted);
		text-align: center;
	}

	.analytics-callout {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		margin-top: clamp(4rem, 9vw, 7rem);
		padding: clamp(1.5rem, 5vw, 3rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(135deg, var(--surface-raised), var(--brand-soft));
	}

	.analytics-callout h2 {
		margin: 0.45rem 0;
		font-size: clamp(1.5rem, 4vw, 2.4rem);
		letter-spacing: -0.045em;
	}

	.analytics-callout p {
		max-width: 42rem;
		margin: 0;
		color: var(--fg-muted);
		line-height: 1.6;
	}

	.coming-soon {
		flex: none;
		padding: 0.65rem 0.9rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: var(--surface-raised);
		font-size: 0.8rem;
		font-weight: 850;
	}

	@media (max-width: 48rem) {
		.hero {
			grid-template-columns: 1fr;
			min-height: 0;
		}

		.hero-art {
			width: min(100%, 30rem);
			margin-inline: auto;
		}

		.provenance-grid {
			grid-template-columns: 1fr;
		}

		.analytics-callout {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
