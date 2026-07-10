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

</section>

<section class="page-shell hero-list" aria-labelledby="hero-list-heading">
	<div class="section-heading">
		<div>
			<h2 id="hero-list-heading">All heroes</h2>
			<p>Choose a hero to see related strategies for each maps and modes.</p>
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
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.35rem 0;
		font-size: clamp(2.4rem, 6vw, 3.6rem);
		font-weight: 800;
		letter-spacing: -0.035em;
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
