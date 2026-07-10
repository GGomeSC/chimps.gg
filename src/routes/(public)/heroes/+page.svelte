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

<section class="page-shell hero-list" aria-labelledby="hero-list-heading">
	<header class="hero-heading">
		<div>
			<span>Hero strategy index</span>
			<h1 id="hero-list-heading">Choose your hero</h1>
			<p>Open their ready strategies across maps, modes, and verified versions.</p>
		</div>
		<strong>{data.heroes.length}<small> heroes</small></strong>
	</header>
	<div class="hero-grid">
		{#each data.heroes as hero (hero.id)}
			<HeroCard {hero} />
		{/each}
	</div>
</section>

<style>
	.hero-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		padding-block: clamp(1.25rem, 3vw, 2rem) 1rem;
	}

	.hero-heading div > span {
		color: var(--brand-strong);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.15rem 0 0.25rem;
		font-size: clamp(1.9rem, 4vw, 2.7rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.hero-heading p {
		max-width: 43rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: 0.88rem;
		line-height: 1.45;
	}

	.hero-heading > strong {
		flex: none;
		color: var(--fg);
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
	}

	.hero-heading > strong small {
		margin-left: 0.2rem;
		color: var(--fg-muted);
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.hero-list {
		padding-bottom: clamp(1.5rem, 4vw, 3rem);
	}

	.hero-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.7rem;
	}

	@media (max-width: 58rem) {
		.hero-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}

	@media (max-width: 42rem) {
		.hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.hero-heading p { max-width: 28rem; }
	}

	@media (max-width: 28rem) {
		.hero-heading { align-items: start; flex-direction: column; }
		.hero-grid { grid-template-columns: 1fr; }
	}
</style>
