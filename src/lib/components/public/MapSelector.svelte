<script lang="ts">
	import { tick } from 'svelte';
	import FallbackImage from './FallbackImage.svelte';
	import type { HomeMap } from '$lib/types/public';
	import type { MapDifficulty } from '$lib/types/db';

	let { maps, guideCount }: { maps: HomeMap[]; guideCount: number } = $props();

	const difficulties: MapDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
	let selected = $state<MapDifficulty>('Beginner');
	let activePage = $state(0);
	let track = $state<HTMLDivElement>();
	const visibleMaps = $derived(maps.filter((map) => map.difficulty === selected));
	const pages = $derived.by(() => {
		const chunks: HomeMap[][] = [];
		for (let index = 0; index < visibleMaps.length; index += 6) {
			chunks.push(visibleMaps.slice(index, index + 6));
		}
		return chunks;
	});

	function selectDifficulty(difficulty: MapDifficulty): void {
		selected = difficulty;
		activePage = 0;
		void tick().then(() => track?.scrollTo({ left: 0 }));
	}

	function scrollToPage(page: number): void {
		if (!track) return;
		const target = Math.max(0, Math.min(page, pages.length - 1));
		track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
	}

	function updateActivePage(): void {
		if (track?.clientWidth) activePage = Math.round(track.scrollLeft / track.clientWidth);
	}

	function selectRelative(currentIndex: number, offset: number): void {
		const nextIndex = (currentIndex + offset + difficulties.length) % difficulties.length;
		selectDifficulty(difficulties[nextIndex]);
		document.getElementById(`map-tier-${nextIndex}`)?.focus();
	}
</script>

<section class="map-selector page-shell" aria-labelledby="map-selector-title">
	<header>
		<div>
			<span class="eyebrow">Find a strategy</span>
			<h1 id="map-selector-title">Choose your map</h1>
		</div>
		<span class="guide-total"><strong>{guideCount}</strong> ready {guideCount === 1 ? 'guide' : 'guides'}</span>
	</header>

	<div class="tier-tabs" role="tablist" aria-label="Map difficulty">
		{#each difficulties as difficulty, index}
			<button
				id={`map-tier-${index}`}
				type="button"
				role="tab"
				aria-selected={selected === difficulty}
				aria-controls="map-grid"
				tabindex={selected === difficulty ? 0 : -1}
				style:--tier-color={`var(--tier-${difficulty.toLowerCase()})`}
				onclick={() => selectDifficulty(difficulty)}
				onkeydown={(event) => {
					if (event.key === 'ArrowRight') { event.preventDefault(); selectRelative(index, 1); }
					if (event.key === 'ArrowLeft') { event.preventDefault(); selectRelative(index, -1); }
				}}
			>
				{difficulty}
			</button>
		{/each}
	</div>

	<div id="map-grid" class="map-viewport" role="tabpanel" aria-live="polite">
		<div class="map-track" bind:this={track} onscroll={updateActivePage}>
			{#each pages as page, pageIndex}
				<div class="map-page" aria-label={`${selected} maps, page ${pageIndex + 1} of ${pages.length}`}>
					{#each page as map (map.id)}
						{#if map.guideCount > 0}
							<a class="map-tile" href={`/strategies?map=${map.id}`} aria-label={`${map.name}: ${map.guideCount} ready ${map.guideCount === 1 ? 'guide' : 'guides'}`}>
								<FallbackImage src={map.imageUrl} alt="">
									{#snippet fallback()}<span class="map-fallback">MAP</span>{/snippet}
								</FallbackImage>
								<span class="map-copy"><strong>{map.name}</strong><small>{map.guideCount} {map.guideCount === 1 ? 'guide' : 'guides'} <b aria-hidden="true">→</b></small></span>
							</a>
						{:else}
							<div class="map-tile unavailable" aria-label={`${map.name}: no verified guides yet`}>
								<FallbackImage src={map.imageUrl} alt="">
									{#snippet fallback()}<span class="map-fallback">MAP</span>{/snippet}
								</FallbackImage>
								<span class="map-copy"><strong>{map.name}</strong><small>No verified guides yet</small></span>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>
	{#if pages.length > 1}
		<nav class="map-pagination" aria-label={`${selected} map pages`}>
			<button type="button" aria-label="Previous map page" disabled={activePage === 0} onclick={() => scrollToPage(activePage - 1)}>←</button>
			<span class="page-dots" aria-label={`Page ${activePage + 1} of ${pages.length}`}>
				{#each pages as _, index}<button class:active={activePage === index} type="button" aria-label={`Go to map page ${index + 1}`} onclick={() => scrollToPage(index)}></button>{/each}
			</span>
			<button type="button" aria-label="Next map page" disabled={activePage === pages.length - 1} onclick={() => scrollToPage(activePage + 1)}>→</button>
		</nav>
	{/if}
</section>

<style>
	.map-selector { padding-top: clamp(1.25rem, 3vw, 2rem); }
	header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
	.eyebrow { color: var(--brand-strong); font-size: .7rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
	h1 { margin: .15rem 0 0; font-size: clamp(1.9rem, 4vw, 2.7rem); line-height: 1; letter-spacing: -.04em; }
	.guide-total { color: var(--fg-muted); font-size: .82rem; }
	.guide-total strong { color: var(--fg); font-family: var(--font-mono); }
	.tier-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: .45rem; margin-bottom: .75rem; padding: .3rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
	.tier-tabs button { min-height: 2.5rem; padding: .45rem .75rem; border: 0; border-radius: .65rem; background: transparent; color: var(--fg-muted); font-size: .82rem; font-weight: 750; }
	.tier-tabs button[aria-selected='true'] { background: color-mix(in srgb, var(--tier-color) 18%, var(--surface-raised)); box-shadow: inset 0 -2px var(--tier-color); color: var(--fg); }
	.map-viewport { overflow: hidden; }
	.map-track { display: flex; overflow-x: auto; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-width: none; touch-action: pan-x pan-y; }
	.map-track::-webkit-scrollbar { display: none; }
	.map-page { display: grid; flex: 0 0 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .7rem; scroll-snap-align: start; }
	.map-tile { position: relative; display: block; min-width: 0; aspect-ratio: 16 / 8.7; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); color: white; box-shadow: var(--shadow-card); text-decoration: none; }
	.map-tile::after { position: absolute; inset: 32% 0 0; background: linear-gradient(transparent, rgb(5 10 17 / .9)); content: ''; }
	.map-tile :global(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 180ms ease; }
	.map-tile[href]:hover { border-color: var(--brand); box-shadow: var(--glow-brand), var(--shadow-card-hover); }
	.map-tile[href]:hover :global(img) { transform: scale(1.025); }
	.map-copy { position: absolute; right: .7rem; bottom: .55rem; left: .7rem; z-index: 1; display: grid; gap: .05rem; min-width: 0; text-shadow: 0 1px 2px black; }
	.map-copy strong { overflow: hidden; font-family: var(--font-display); font-size: clamp(.82rem, 1.3vw, 1rem); text-overflow: ellipsis; white-space: nowrap; }
	.map-copy small { color: rgb(255 255 255 / .72); font-size: .68rem; }
	.map-copy b { color: var(--brand); }
	.unavailable { filter: saturate(.45); }
	.unavailable :global(img) { opacity: .58; }
	.map-fallback { display: grid; width: 100%; height: 100%; place-items: center; background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft)); color: var(--fg-muted); font-weight: 900; letter-spacing: .15em; }
	.map-pagination { display: flex; align-items: center; justify-content: center; gap: .65rem; min-height: 2.35rem; padding-top: .5rem; }
	.map-pagination > button { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--border); border-radius: .55rem; background: var(--surface-raised); color: var(--fg); }
	.map-pagination > button:disabled { opacity: .35; cursor: default; }
	.page-dots { display: flex; gap: .35rem; }
	.page-dots button { width: .45rem; height: .45rem; padding: 0; border: 0; border-radius: 50%; background: var(--border-strong); }
	.page-dots button.active { width: 1.15rem; border-radius: 999px; background: var(--brand); }
	@media (max-width: 46rem) { .map-page { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; } .tier-tabs { overflow-x: auto; grid-template-columns: repeat(4, minmax(7.4rem, 1fr)); } }
	@media (max-width: 32rem) { header { align-items: start; flex-direction: column; gap: .4rem; } .map-copy { right: .5rem; bottom: .4rem; left: .5rem; } }
	@media (prefers-reduced-motion: reduce) { .map-track { scroll-behavior: auto; } }
</style>
