<script lang="ts">
	import EntityIcon from './EntityIcon.svelte';
	import { heroAccent } from '$lib/hero-accents';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';
	import type { HeroSummary } from '$lib/types/public';

	let { hero }: { hero: HeroSummary } = $props();

	const accent = $derived(heroAccent(hero.name));
	const hasGuides = $derived(hero.guideCount > 0);
</script>

<a class="hero-card" href={href(`/heroes/${hero.id}`)} style:--hc={accent}>
	<span class="art" aria-hidden="true"></span>
	<span class="portrait">
		<EntityIcon src={hero.iconUrl} name={hero.name} compact />
	</span>
	<span class="info">
		<strong>{hero.name}</strong>
		<small>
			{#if hasGuides}
				{hero.guideCount === 1
					? m.ready_guides_one({ count: hero.guideCount })
					: m.ready_guides_other({ count: hero.guideCount })}
			{:else}
				{m.no_guides_yet()}
			{/if}
		</small>
	</span>
	<span class="cta" aria-hidden="true">→</span>
</a>

<style>
	.hero-card {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.85rem;
		min-height: 7rem;
		padding: var(--space-3);
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-raised);
		color: inherit;
		text-decoration: none;
		box-shadow: var(--shadow-card);
		transition:
			transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1),
			border-color 200ms ease,
			box-shadow 200ms ease;
	}

	.hero-card:hover,
	.hero-card:focus-visible {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--hc) 60%, var(--border));
		box-shadow: var(--shadow-card-hover);
	}

	.art {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 14% 50%, color-mix(in srgb, var(--hc) 28%, transparent), transparent 42%),
			linear-gradient(110deg, color-mix(in srgb, var(--hc) 11%, var(--surface-raised)), var(--surface-raised) 75%);
		transition: scale 300ms ease;
	}

	.hero-card:hover .art {
		scale: 1.05;
	}

	.portrait {
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--hc) 40%, transparent));
	}

	.portrait :global(.icon-shell) {
		width: 4rem;
		border-color: color-mix(in srgb, var(--hc) 40%, var(--border));
	}

	.info {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 0.2rem;
		min-width: 0;
	}

	strong {
		overflow: hidden;
		font-size: 1.2rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	small {
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-variant-numeric: tabular-nums;
	}

	.cta {
		position: relative;
		z-index: 1;
		color: var(--brand-strong);
		font-size: 1.25rem;
		font-weight: 700;
		transition: translate 200ms ease;
	}

	.hero-card:hover .cta,
	.hero-card:focus-visible .cta {
		translate: 3px 0;
	}
</style>
