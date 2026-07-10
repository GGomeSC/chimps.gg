<script lang="ts">
	import DifficultyPips from './DifficultyPips.svelte';
	import EntityIcon from './EntityIcon.svelte';
	import FallbackImage from './FallbackImage.svelte';
	import type { PublicStrategySummary } from '$lib/types/public';

	let { strategy }: { strategy: PublicStrategySummary } = $props();
</script>

<article class="guide-card">
	<a href={`/strategies/${strategy.id}`} aria-label={`View ${strategy.title}`}>
		<FallbackImage src={strategy.map.imageUrl} alt="">
			{#snippet fallback()}<span class="map-fallback">MAP</span>{/snippet}
		</FallbackImage>
		<span class="version"><span aria-hidden="true">✓</span> v{strategy.verifiedVersion}</span>
		{#if strategy.hero}
			<span class="hero" title={strategy.hero.name}><EntityIcon src={strategy.hero.iconUrl} name={strategy.hero.name} compact /></span>
		{/if}
		<span class="copy">
			<strong>{strategy.title}</strong>
			<small>{strategy.map.name} · {strategy.mode.name}</small>
			<span class="meta">
				{#if strategy.map.difficulty}<b>{strategy.map.difficulty}</b>{/if}
				<DifficultyPips value={strategy.executionDifficulty} />
			</span>
		</span>
	</a>
</article>

<style>
	.guide-card { flex: 0 0 clamp(18rem, 28vw, 21rem); scroll-snap-align: start; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); box-shadow: var(--shadow-card); }
	a { position: relative; display: block; height: 12rem; overflow: hidden; color: white; text-decoration: none; }
	a::after { position: absolute; inset: 25% 0 0; background: linear-gradient(transparent, rgb(5 10 17 / .94)); content: ''; }
	a :global(> img) { width: 100%; height: 100%; object-fit: cover; transition: transform 180ms ease; }
	.guide-card:hover, .guide-card:focus-within { border-color: var(--brand); box-shadow: var(--glow-brand), var(--shadow-card-hover); }
	.guide-card:hover a :global(> img), .guide-card:focus-within a :global(> img) { transform: scale(1.025); }
	.version { position: absolute; top: .65rem; right: .65rem; z-index: 2; padding: .25rem .55rem; border: 1px solid rgb(255 255 255 / .14); border-radius: var(--radius-sm); background: rgb(5 10 17 / .74); font-family: var(--font-mono); font-size: var(--text-meta); backdrop-filter: blur(5px); }
	.version span { color: var(--bloon-green); }
	.hero { position: absolute; right: .7rem; bottom: 3.6rem; z-index: 2; filter: drop-shadow(0 2px 5px rgb(0 0 0 / .6)); }
	.hero :global(.icon-shell) { border-color: rgb(255 255 255 / .3); background: rgb(5 10 17 / .65); }
	.copy { position: absolute; right: .8rem; bottom: .7rem; left: .8rem; z-index: 2; display: grid; gap: .1rem; min-width: 0; text-shadow: 0 1px 2px black; }
	.copy strong, .copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.copy strong { padding-right: 2.5rem; font-family: var(--font-display); font-size: 1.15rem; }
	.copy small { color: rgb(255 255 255 / .78); font-size: var(--text-meta); }
	.meta { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: .5rem; margin-top: .18rem; }
	.meta b { color: rgb(255 255 255 / .86); font-size: var(--text-meta); font-weight: 650; }
	.meta :global(small) { color: rgb(255 255 255 / .7); }
	.map-fallback { display: grid; width: 100%; height: 100%; place-items: center; background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft)); color: var(--fg-muted); font-weight: 900; letter-spacing: .15em; }
</style>
