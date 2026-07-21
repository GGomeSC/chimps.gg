<script lang="ts">
	import { tick } from 'svelte';
	import FallbackImage from './FallbackImage.svelte';
	import PageIntro from './PageIntro.svelte';
	import { mapDifficultyLabel } from '$lib/labels';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';
	import type { HomeMap } from '$lib/types/public';
	import type { MapDifficulty } from '$lib/types/db';

	let { maps, title = m.choose_your_map(), lead }: { maps: HomeMap[]; title?: string; lead?: string } = $props();

	function guidesCount(count: number): string {
		return count === 1 ? m.guides_count_one({ count }) : m.guides_count_other({ count });
	}

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

<section id="maps" class="map-selector page-shell" aria-labelledby="map-selector-title">
	<PageIntro
		{title}
		{lead}
		headingId="map-selector-title"
	/>

	<div class="tier-tabs" role="tablist" aria-label={m.map_difficulty()}>
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
				{mapDifficultyLabel(difficulty)}
			</button>
		{/each}
	</div>

	{#key selected}
		<div id="map-grid" class="map-viewport" role="tabpanel" aria-live="polite">
			<div class="map-track" bind:this={track} onscroll={updateActivePage}>
				{#each pages as page, pageIndex}
					<div class="map-page" aria-label={m.maps_page_label({ difficulty: mapDifficultyLabel(selected), page: pageIndex + 1, total: pages.length })}>
						{#each page as map (map.id)}
							{#if map.guideCount > 0}
								<a class="map-tile" href={href(`/strategies?map=${map.id}`)} aria-label={m.map_tile_ready_label({ name: map.name, guides: guidesCount(map.guideCount) })}>
									<FallbackImage src={map.imageUrl} alt="">
										{#snippet fallback()}<span class="map-fallback">{m.map_fallback()}</span>{/snippet}
									</FallbackImage>
									<span class="map-copy"><strong>{map.name}</strong><small>{guidesCount(map.guideCount)} <b aria-hidden="true">→</b></small></span>
								</a>
							{:else}
								<div class="map-tile unavailable" aria-label={m.map_tile_none_label({ name: map.name })}>
									<FallbackImage src={map.imageUrl} alt="">
										{#snippet fallback()}<span class="map-fallback">{m.map_fallback()}</span>{/snippet}
									</FallbackImage>
									<span class="map-copy"><strong>{map.name}</strong><small>{m.map_no_guides()}</small></span>
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/key}
	{#if pages.length > 1}
		<nav class="map-pagination" aria-label={m.map_pages_label({ difficulty: mapDifficultyLabel(selected) })}>
			<button type="button" aria-label={m.map_page_prev()} disabled={activePage === 0} onclick={() => scrollToPage(activePage - 1)}>←</button>
			<span class="page-dots" aria-label={m.page_of({ page: activePage + 1, total: pages.length })}>
				{#each pages as _, index}<button class:active={activePage === index} type="button" aria-label={m.go_to_map_page({ page: index + 1 })} onclick={() => scrollToPage(index)}></button>{/each}
			</span>
			<button type="button" aria-label={m.map_page_next()} disabled={activePage === pages.length - 1} onclick={() => scrollToPage(activePage + 1)}>→</button>
		</nav>
	{/if}
</section>

<style>
	.map-selector { display: grid; gap: var(--space-5); padding-block: var(--space-6); }
	.tier-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-1); padding: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-card); }
	.tier-tabs button { min-height: var(--control-height); padding: .65rem 1rem; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--fg-muted); font-size: var(--text-meta); font-weight: 750; transition: background var(--motion-standard) ease, color var(--motion-fast) ease; }
	.tier-tabs button[aria-selected='true'] { background: color-mix(in srgb, var(--tier-color) 18%, var(--surface-raised)); box-shadow: inset 0 -2px var(--tier-color); color: var(--fg); }
	.map-viewport { overflow: hidden; }
	.map-track { display: flex; overflow-x: auto; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-width: none; touch-action: pan-x pan-y; }
	.map-track::-webkit-scrollbar { display: none; }
	.map-page { display: grid; flex: 0 0 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); scroll-snap-align: start; }
	.map-tile { position: relative; display: block; min-width: 0; aspect-ratio: 16 / 8.7; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); color: white; box-shadow: var(--shadow-card); text-decoration: none; }
	.map-tile::after { position: absolute; inset: 32% 0 0; background: linear-gradient(transparent, rgb(5 10 17 / .9)); content: ''; }
	.map-tile :global(img) { width: 100%; height: 100%; object-fit: cover; transition: transform 180ms ease; }
	.map-tile[href]:hover { border-color: var(--brand); box-shadow: var(--glow-brand), var(--shadow-card-hover); }
	.map-tile[href]:hover :global(img) { transform: scale(1.025); }
	.map-copy { position: absolute; right: var(--space-3); bottom: var(--space-2); left: var(--space-3); z-index: 1; display: grid; gap: .1rem; min-width: 0; text-shadow: 0 1px 2px black; }
	.map-copy strong { overflow: hidden; font-family: var(--font-display); font-size: 1.125rem; text-overflow: ellipsis; white-space: nowrap; }
	.map-copy small { color: rgb(255 255 255 / .78); font-size: var(--text-meta); }
	.map-copy b { color: var(--brand); }
	.unavailable { filter: saturate(.45); }
	.unavailable :global(img) { opacity: .58; }
	.map-fallback { display: grid; width: 100%; height: 100%; place-items: center; background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft)); color: var(--fg-muted); font-weight: 900; letter-spacing: .15em; }
	.map-pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); min-height: var(--icon-control); }
	.map-pagination > button { display: grid; width: var(--icon-control); height: var(--icon-control); place-items: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-raised); color: var(--fg); transition: border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); }
	.map-pagination > button:not(:disabled):hover { border-color: var(--brand); transform: translateY(-1px); }
	.map-pagination > button:not(:disabled):active { transform: scale(.94); }
	.map-pagination > button:disabled { opacity: .35; cursor: default; }
	.page-dots { display: flex; gap: .15rem; }
	.page-dots button { display: grid; width: var(--icon-control); height: var(--icon-control); padding: 0; place-items: center; border: 0; background: transparent; }
	.page-dots button::after { width: 1.25rem; height: .5rem; border-radius: 999px; background: var(--border-strong); content: ''; transform: scaleX(.4); transition: background var(--motion-fast) ease, transform var(--motion-standard) var(--ease-out); }
	.page-dots button:hover::after { background: var(--fg-muted); transform: scaleX(.5); }
	.page-dots button.active::after { background: var(--brand); transform: scaleX(1); }
	@media (max-width: 52rem) { .map-page { grid-template-columns: repeat(2, minmax(0, 1fr)); } .tier-tabs { overflow-x: auto; grid-template-columns: repeat(4, minmax(8rem, 1fr)); } }
	@media (max-width: 34rem) { .map-page { grid-template-columns: 1fr; } .tier-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (prefers-reduced-motion: reduce) { .map-track { scroll-behavior: auto; } }
</style>
