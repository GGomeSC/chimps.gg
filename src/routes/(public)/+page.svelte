<script lang="ts">
	import FallbackImage from '$lib/components/public/FallbackImage.svelte';
	import HeroCard from '$lib/components/public/HeroCard.svelte';
	import StrategyCard from '$lib/components/public/StrategyCard.svelte';

	let { data } = $props();

	const featured = $derived(data.strategies[0] ?? null);
</script>

<section class="content-section page-shell">
	<div class="section-heading">
		<div>
			<h2>Latest guides</h2>
			<p>So you can open on a second screen.</p>
		</div>
		<a href="/strategies">All →</a>
	</div>
	{#if data.strategies.length > 0}
		<div class="strategy-grid">
			{#each data.strategies as strategy (strategy.id)}
				<StrategyCard {strategy} />
			{/each}
		</div>
	{:else}
		<p class="quiet">The first guides are being prepared in Studio.</p>
	{/if}
</section>

<section class="content-section page-shell">
	<div class="section-heading">
		<div>
			<h2>Heroes</h2>
			<p>See where each hero appears across ready maps and modes.</p>
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
		<span class="kicker">Coming soon</span>
		<h2>Towers analytics—when the data is real.</h2>
		<p>
			Hero win rates, popularity, and map performance need trustworthy community
			play data. We will show them after a consented data pipeline exists, not before.
		</p>
	</div>
	<span class="coming-soon">Community data coming soon</span>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(18rem, 0.95fr);
		gap: clamp(2rem, 6vw, 5rem);
		align-items: center;
		padding-block: clamp(3.5rem, 8vw, 6rem);
	}

	.kicker {
		color: var(--brand-strong);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.6rem 0 1rem;
		font-size: clamp(2.8rem, 7vw, 4.6rem);
		font-weight: 800;
		letter-spacing: -0.035em;
		line-height: 1.02;
	}

	h1 span {
		color: var(--brand-strong);
	}

	.hero-copy > p {
		max-width: 37rem;
		color: var(--fg-muted);
		font-size: clamp(1rem, 2vw, 1.15rem);
		line-height: 1.65;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.stat-tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
		max-width: 26rem;
		margin: 2rem 0 0;
	}

	.stat-tiles > div {
		padding: 0.7rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	.stat-tiles dd {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}

	.stat-tiles dd.mono {
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 1.2rem;
	}

	.stat-tiles dt {
		color: var(--fg-muted);
		font-size: 0.72rem;
	}

	/* The featured panel is the real latest ready strategy: official map art
	   with its final placements pulsing on top. Product proof, not decoration. */
	.live-map {
		position: relative;
		display: block;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-card);
		transition:
			transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1),
			border-color 200ms ease,
			box-shadow 200ms ease;
	}

	.live-map:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
		box-shadow: var(--glow-brand), var(--shadow-card-hover);
	}

	.live-map::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 45%, rgb(9 14 22 / 0.55));
		content: '';
	}

	.live-map :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.map-fallback {
		display: grid;
		height: 100%;
		place-items: center;
		padding: 1.5rem;
		background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft));
		color: var(--fg-muted);
		font-weight: 700;
		text-align: center;
	}

	.live-map.empty::after {
		content: none;
	}

	.live-dot {
		position: absolute;
		z-index: 1;
		width: 11px;
		height: 11px;
		border: 2px solid rgb(255 255 255 / 0.9);
		border-radius: 50%;
		background: var(--brand);
		translate: -50% -50%;
		animation: dot-pulse 2.6s ease-in-out infinite;
	}

	.live-dot.hero-dot {
		background: var(--accent);
		animation-delay: 0.8s;
	}

	@keyframes dot-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgb(126 203 82 / 0.45);
		}
		50% {
			box-shadow: 0 0 0 8px rgb(126 203 82 / 0);
		}
	}

	.caption {
		position: absolute;
		bottom: 0.75rem;
		left: 0.75rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		max-width: calc(100% - 1.5rem);
		padding: 0.3rem 0.75rem;
		border: 1px solid rgb(255 255 255 / 0.12);
		border-radius: 999px;
		background: rgb(9 14 22 / 0.65);
		color: rgb(255 255 255 / 0.92);
		font-size: 0.8rem;
		font-weight: 650;
		backdrop-filter: blur(6px);
	}

	.play {
		color: var(--brand);
		font-size: 0.65rem;
	}

	.caption-version {
		color: rgb(255 255 255 / 0.7);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
	}

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
		padding-top: clamp(4rem, 9vw, 6rem);
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
		margin-top: clamp(4rem, 9vw, 6rem);
		padding: clamp(1.5rem, 5vw, 3rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface);
	}

	.analytics-callout h2 {
		margin: 0.45rem 0;
		font-size: clamp(1.5rem, 4vw, 2.2rem);
		font-weight: 750;
		letter-spacing: -0.03em;
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
		font-weight: 700;
	}

	@media (max-width: 48rem) {
		.hero {
			grid-template-columns: 1fr;
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
