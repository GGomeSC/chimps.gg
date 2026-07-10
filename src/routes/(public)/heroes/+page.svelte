<script lang="ts">
	import HeroCard from '$lib/components/public/HeroCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Bloons TD 6 heroes · chimps.gg</title>
	<meta
		name="description"
		content="Explore BTD6 heroes and the ready chimps.gg strategies, maps, modes, and verified versions associated with each one."
	/>
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content="BTD6 heroes · chimps.gg" />
	<meta property="og:description" content="Browse heroes through real, curated strategy coverage." />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<section class="hero-heading page-shell">
	<div>
		<span>Hero discovery</span>
		<h1>Pick your centerpiece.</h1>
		<p>
			Explore factual guide coverage from the current chimps.gg database—without invented win
			rates or popularity scores.
		</p>
	</div>
	<div class="coverage-card">
		<strong>{data.heroes.length}</strong>
		<span>curated hero entries</span>
		<small>Guide counts include ready strategies only.</small>
	</div>
</section>

<section class="page-shell hero-list" aria-labelledby="hero-list-heading">
	<div class="section-heading">
		<div>
			<h2 id="hero-list-heading">All heroes</h2>
			<p>Open a hero to see related ready strategies, maps, modes, and verified versions.</p>
		</div>
	</div>
	<div class="hero-grid">
		{#each data.heroes as hero (hero.id)}
			<HeroCard {hero} />
		{/each}
	</div>
</section>

<style>
	.hero-heading {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 2rem;
		align-items: end;
		padding-block: clamp(3rem, 8vw, 6rem);
	}

	.hero-heading > div > span {
		color: var(--brand-strong);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.35rem 0;
		font-size: clamp(2.7rem, 8vw, 5rem);
		letter-spacing: -0.065em;
	}

	.hero-heading p {
		max-width: 43rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: 1.05rem;
		line-height: 1.6;
	}

	.coverage-card {
		display: grid;
		min-width: 13rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--brand-soft);
	}

	.coverage-card strong {
		color: var(--brand-strong);
		font-size: 2.5rem;
		line-height: 1;
	}

	.coverage-card span {
		font-weight: 850;
	}

	.coverage-card small {
		margin-top: 0.5rem;
		color: var(--fg-muted);
	}

	.hero-list {
		padding-bottom: 2rem;
	}

	@media (max-width: 42rem) {
		.hero-heading {
			grid-template-columns: 1fr;
			align-items: start;
		}
	}
</style>
