<script lang="ts">
	import DifficultyPips from './DifficultyPips.svelte';
	import EntityIcon from './EntityIcon.svelte';
	import FallbackImage from './FallbackImage.svelte';
	import type { PublicStrategySummary } from '$lib/types/public';

	let { strategy }: { strategy: PublicStrategySummary } = $props();
</script>

<article class="strategy-card">
	<a class="media" href={`/strategies/${strategy.id}`} aria-label={`View ${strategy.title}`}>
		<FallbackImage src={strategy.map.imageUrl} alt={`${strategy.map.name} map`}>
			{#snippet fallback()}
				<div class="map-fallback" aria-label={`${strategy.map.name} image unavailable`}>MAP</div>
			{/snippet}
		</FallbackImage>
		<span class="version">v{strategy.verifiedVersion}</span>
	</a>

	<div class="body">
		<div class="eyebrow">
			<span>{strategy.map.name}</span>
			<span aria-hidden="true">•</span>
			<span>{strategy.mode.name}</span>
		</div>
		<h3><a href={`/strategies/${strategy.id}`}>{strategy.title}</a></h3>
		{#if strategy.description}
			<p>{strategy.description}</p>
		{/if}
		<footer>
			<span class="hero">
				{#if strategy.hero}
					<EntityIcon src={strategy.hero.iconUrl} name={strategy.hero.name} compact />
					{strategy.hero.name}
				{:else}
					No hero
				{/if}
			</span>
			<DifficultyPips value={strategy.executionDifficulty} />
		</footer>
	</div>
</article>

<style>
	.strategy-card {
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
		transition:
			transform 160ms ease,
			box-shadow 160ms ease;
	}

	.strategy-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-card-hover);
	}

	.media {
		position: relative;
		display: block;
		aspect-ratio: 1.65;
		overflow: hidden;
		background: var(--surface);
	}

	.media :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 240ms ease;
	}

	.strategy-card:hover .media :global(img) {
		transform: scale(1.025);
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
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem 0.55rem;
		border: 1px solid rgb(255 255 255 / 0.25);
		border-radius: 999px;
		background: rgb(16 28 45 / 0.82);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 800;
		backdrop-filter: blur(8px);
	}

	.body {
		display: grid;
		gap: 0.7rem;
		padding: 1rem;
	}

	.eyebrow {
		display: flex;
		gap: 0.35rem;
		color: var(--brand-strong);
		font-size: 0.75rem;
		font-weight: 850;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	h3 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.2;
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
		font-size: 0.9rem;
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
		padding-top: 0.2rem;
		font-size: 0.85rem;
	}

	.hero {
		gap: 0.45rem;
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.strategy-card,
		.media :global(img) {
			transition: none;
		}
	}
</style>
