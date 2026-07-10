<script lang="ts">
	import HeroCard from '$lib/components/public/HeroCard.svelte';
	import PageIntro from '$lib/components/public/PageIntro.svelte';

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
	<PageIntro
		title="Choose your hero"
		headingId="hero-list-heading"
	/>
	<div class="hero-grid">
		{#each data.heroes as hero (hero.id)}
			<HeroCard {hero} />
		{/each}
	</div>
</section>

<style>
	.hero-list {
		display: grid;
		gap: var(--space-4);
		padding-block: var(--space-5) var(--space-4);
	}

	.hero-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
	}

	@media (max-width: 58rem) {
		.hero-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}

	@media (max-width: 42rem) {
		.hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}

	@media (max-width: 34rem) {
		.hero-grid { grid-template-columns: 1fr; }
	}
</style>
