<script lang="ts">
	import DifficultyPips from './DifficultyPips.svelte';
	import EntityIcon from './EntityIcon.svelte';
	import FallbackImage from './FallbackImage.svelte';
	import { mapDifficultyLabel } from '$lib/labels';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';
	import type { PublicStrategySummary } from '$lib/types/public';

	let { strategy }: { strategy: PublicStrategySummary } = $props();

	const towerCount = $derived(strategy.placementDots.length);
	const tierVar = $derived(
		strategy.map.difficulty ? `var(--tier-${strategy.map.difficulty.toLowerCase()})` : null
	);
</script>

<article class="strategy-card">
	<a class="media" href={href(`/strategies/${strategy.id}`)} aria-label={m.card_view_label({ title: strategy.title })}>
		<FallbackImage src={strategy.map.imageUrl} alt={m.card_map_alt({ name: strategy.map.name })}>
			{#snippet fallback()}
				<div class="map-fallback" aria-label={m.card_image_unavailable({ name: strategy.map.name })}>{m.map_fallback()}</div>
			{/snippet}
		</FallbackImage>
		<span class="version"><span aria-hidden="true">✓</span> v{strategy.verifiedVersion}</span>
		{#if towerCount > 0}
			<span class="dots" aria-hidden="true">
				{#each strategy.placementDots as dot (dot.id)}
					<span class="dot" class:hero-dot={dot.isHero} style:left={`${dot.x * 100}%`} style:top={`${dot.y * 100}%`}></span>
				{/each}
			</span>
			<span class="hint" aria-hidden="true">
				{towerCount === 1 ? m.towers_hint_one({ count: towerCount }) : m.towers_hint_other({ count: towerCount })}
			</span>
		{/if}
	</a>

	<div class="body">
		<div class="badges">
			{#if strategy.map.difficulty && tierVar}
				<span class="tier" style:--tc={tierVar}>{mapDifficultyLabel(strategy.map.difficulty)}</span>
			{/if}
			<span class="mode">{strategy.mode.name}</span>
			<span class="map-name">{strategy.map.name}</span>
		</div>
		<h3><a href={href(`/strategies/${strategy.id}`)}>{strategy.title}</a></h3>
		{#if strategy.description}
			<p>{strategy.description}</p>
		{/if}
		<footer>
			<span class="hero">
				{#if strategy.hero}
					<EntityIcon src={strategy.hero.iconUrl} name={strategy.hero.name} compact />
					{strategy.hero.name}
				{:else}
					{m.no_hero()}
				{/if}
			</span>
			<DifficultyPips value={strategy.executionDifficulty} />
		</footer>
	</div>
</article>

<style>
	.strategy-card {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
		transition:
			transform 180ms cubic-bezier(0.2, 0.7, 0.3, 1),
			border-color 180ms ease,
			box-shadow 180ms ease;
	}

	.strategy-card:hover,
	.strategy-card:focus-within {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
		box-shadow: var(--glow-brand), var(--shadow-card-hover);
	}

	.media {
		position: relative;
		display: block;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--surface);
	}

	.media::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 55%, rgb(9 14 22 / 0.5));
		content: '';
	}

	.media :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 240ms ease;
	}

	.strategy-card:hover .media :global(img),
	.strategy-card:focus-within .media :global(img) {
		transform: scale(1.03);
	}

	.map-fallback {
		display: grid;
		height: 100%;
		place-items: center;
		background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft));
		color: var(--fg);
		font-weight: 900;
		letter-spacing: 0.15em;
	}

	.version {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.55rem;
		border: 1px solid rgb(255 255 255 / 0.14);
		border-radius: var(--radius-sm);
		background: rgb(9 14 22 / 0.78);
		color: #eaf1f8;
		font-family: var(--font-mono);
		font-size: var(--text-meta);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		backdrop-filter: blur(6px);
	}

	.version span {
		color: var(--bloon-green);
		font-weight: 800;
	}

	/* Placement X-ray: the final layout fades in over the map art on hover.
	   Coordinates are approximate over the NK select art, hence soft rings. */
	.dots {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.dot {
		position: absolute;
		width: 11px;
		height: 11px;
		border: 2px solid rgb(255 255 255 / 0.85);
		border-radius: 50%;
		background: var(--brand);
		box-shadow: 0 0 0 3px rgb(126 203 82 / 0.3);
		opacity: 0;
		scale: 0.4;
		translate: -50% -50%;
		transition:
			opacity 200ms ease,
			scale 260ms cubic-bezier(0.2, 0.7, 0.3, 1.4);
	}

	.dot.hero-dot {
		background: var(--accent);
		box-shadow: 0 0 0 3px rgb(239 185 62 / 0.35);
	}

	.strategy-card:hover .dot,
	.strategy-card:focus-within .dot {
		opacity: 1;
		scale: 1;
	}

	.strategy-card:hover .dot:nth-child(odd) {
		transition-delay: 60ms;
	}

	.hint {
		position: absolute;
		bottom: 0.6rem;
		left: 0.6rem;
		z-index: 2;
		padding: 0.2rem 0.6rem;
		border: 1px solid rgb(255 255 255 / 0.12);
		border-radius: 999px;
		background: rgb(9 14 22 / 0.6);
		color: rgb(255 255 255 / 0.88);
		font-size: var(--text-meta);
		font-weight: 600;
		letter-spacing: 0.03em;
		backdrop-filter: blur(6px);
		opacity: 0;
		translate: 0 4px;
		transition:
			opacity 200ms ease,
			translate 200ms ease;
	}

	.strategy-card:hover .hint,
	.strategy-card:focus-within .hint {
		opacity: 1;
		translate: 0 0;
	}

	.body {
		display: grid;
		gap: var(--space-2);
		align-content: start;
		padding: var(--space-4);
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
	}

	.tier {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.18rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--tc) 45%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--tc) 13%, transparent);
		color: color-mix(in srgb, var(--tc) 75%, var(--fg));
		font-size: var(--text-meta);
		font-weight: 700;
	}

	.tier::before {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--tc);
		content: '';
	}

	.mode {
		padding: 0.18rem 0.55rem;
		border-radius: var(--radius-sm);
		background: var(--brand-soft);
		color: var(--brand-strong);
		font-size: var(--text-meta);
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.map-name {
		color: var(--fg-muted);
		font-size: var(--text-meta);
		font-weight: 600;
	}

	h3 {
		margin: 0;
		font-family: var(--font-body);
		font-size: 1.2rem;
		font-weight: 750;
		letter-spacing: -0.015em;
		line-height: 1.25;
	}

	h3 a {
		color: inherit;
		text-decoration: none;
	}

	p {
		display: -webkit-box;
		overflow: hidden;
		margin: 0;
		color: var(--fg-muted);
		font-size: var(--text-meta);
		line-height: 1.55;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	footer,
	.hero {
		display: flex;
		align-items: center;
	}

	footer {
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: auto;
		padding-top: 0.2rem;
		font-size: var(--text-meta);
	}

	.hero {
		gap: 0.45rem;
		min-width: 0;
		color: var(--fg-muted);
		font-weight: 600;
	}
</style>
