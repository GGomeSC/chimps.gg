<script lang="ts">
	import EntityIcon from './EntityIcon.svelte';
	import { heroAccent } from '$lib/hero-accents';
	import type { HeroSummary } from '$lib/types/public';

	let { hero }: { hero: HeroSummary } = $props();

	const accent = $derived(heroAccent(hero.name));
	const hasGuides = $derived(hero.guideCount > 0);
</script>

<a class="hero-card" href={`/heroes/${hero.id}`} style:--hc={accent}>
	<span class="art" aria-hidden="true"></span>
	<span class="portrait">
		<EntityIcon src={hero.iconUrl} name={hero.name} />
	</span>
	<span class="info">
		<strong>{hero.name}</strong>
		<span class="coverage">
			<span class="bar"><i style:width={hasGuides ? '100%' : '0'}></i></span>
			<small>
				{#if hasGuides}
					{hero.guideCount} {hero.guideCount === 1 ? 'ready guide' : 'ready guides'}
				{:else}
					No guides yet
				{/if}
			</small>
		</span>
		<span class="cta" aria-hidden="true">
			{hasGuides ? 'View strategies →' : 'Be the first clear →'}
		</span>
	</span>
</a>

<style>
	.hero-card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		aspect-ratio: 3 / 3.4;
		padding: 1rem;
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
		transform: translateY(-4px);
		border-color: color-mix(in srgb, var(--hc) 60%, var(--border));
		box-shadow: var(--shadow-card-hover);
	}

	.art {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 50% 26%, color-mix(in srgb, var(--hc) 34%, transparent), transparent 62%),
			linear-gradient(200deg, color-mix(in srgb, var(--hc) 16%, var(--surface-raised)), var(--surface-raised) 75%);
		transition: scale 300ms ease;
	}

	.hero-card:hover .art {
		scale: 1.05;
	}

	.portrait {
		position: absolute;
		top: 13%;
		left: 50%;
		translate: -50% 0;
		filter: drop-shadow(0 10px 24px color-mix(in srgb, var(--hc) 45%, transparent));
	}

	.portrait :global(.icon-shell) {
		width: 6rem;
		border-color: color-mix(in srgb, var(--hc) 40%, var(--border));
		border-radius: 50%;
	}

	.info {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 0.35rem;
	}

	strong {
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.coverage {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bar {
		flex: 1;
		height: 4px;
		overflow: hidden;
		border-radius: 999px;
		background: color-mix(in srgb, var(--border) 80%, transparent);
	}

	.bar i {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--hc);
	}

	small {
		flex: none;
		color: var(--fg-muted);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	.cta {
		color: var(--brand-strong);
		font-size: 0.8rem;
		font-weight: 700;
		opacity: 0;
		translate: 0 4px;
		transition:
			opacity 200ms ease,
			translate 200ms ease;
	}

	.hero-card:hover .cta,
	.hero-card:focus-visible .cta {
		opacity: 1;
		translate: 0 0;
	}
</style>
