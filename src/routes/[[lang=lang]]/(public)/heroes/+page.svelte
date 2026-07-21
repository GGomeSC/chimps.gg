<script lang="ts">
	import HeroCard from '$lib/components/public/HeroCard.svelte';
	import PageIntro from '$lib/components/public/PageIntro.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>{m.heroes_title()}</title>
	<meta name="description" content={m.heroes_meta_description()} />
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={m.heroes_og_title()} />
	<meta property="og:description" content={m.heroes_og_description()} />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<section class="page-shell hero-list" aria-labelledby="hero-list-heading">
	<PageIntro
		title={m.choose_your_hero()}
		lead={m.heroes_lead()}
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: var(--space-3);
	}

	@media (max-width: 42rem) {
		.hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
</style>
