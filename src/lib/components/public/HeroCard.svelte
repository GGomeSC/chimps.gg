<script lang="ts">
	import EntityIcon from './EntityIcon.svelte';
	import type { HeroSummary } from '$lib/types/public';

	let { hero }: { hero: HeroSummary } = $props();
</script>

<a class="hero-card" href={`/heroes/${hero.id}`}>
	<EntityIcon src={hero.iconUrl} name={hero.name} />
	<span class="copy">
		<strong>{hero.name}</strong>
		<small>{hero.guideCount} {hero.guideCount === 1 ? 'ready guide' : 'ready guides'}</small>
	</span>
	<span class="arrow" aria-hidden="true">→</span>
</a>

<style>
	.hero-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		color: inherit;
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}

	.hero-card:hover {
		border-color: var(--brand);
	}

	.copy {
		display: grid;
		gap: 0.25rem;
	}

	strong {
		font-size: 1.05rem;
	}

	small {
		color: var(--fg-muted);
	}

	.arrow {
		color: var(--brand-strong);
		font-size: 1.35rem;
		font-weight: 900;
	}
</style>
