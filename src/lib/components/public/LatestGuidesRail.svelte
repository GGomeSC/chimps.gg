<script lang="ts">
	import CompactStrategyCard from './CompactStrategyCard.svelte';
	import type { PublicStrategySummary } from '$lib/types/public';

	let { strategies }: { strategies: PublicStrategySummary[] } = $props();
	let rail = $state<HTMLDivElement>();

	function scroll(direction: number): void {
		rail?.scrollBy({ left: direction * Math.min(rail.clientWidth * 0.8, 600), behavior: 'smooth' });
	}
</script>

<section class="latest page-shell" aria-labelledby="latest-guides-title">
	<header>
		<h2 id="latest-guides-title">Latest guides</h2>
		<div class="actions">
			<a href="/strategies">View all →</a>
			{#if strategies.length > 1}
				<button type="button" aria-label="Previous guides" onclick={() => scroll(-1)}>←</button>
				<button type="button" aria-label="Next guides" onclick={() => scroll(1)}>→</button>
			{/if}
		</div>
	</header>
	{#if strategies.length > 0}
		<div class="rail" bind:this={rail} aria-label="Recent strategy guides">
			{#each strategies as strategy (strategy.id)}<CompactStrategyCard {strategy} />{/each}
		</div>
	{:else}
		<p class="quiet">The first guides are being prepared in Studio.</p>
	{/if}
</section>

<style>
	.latest { padding-block: clamp(1.5rem, 3vw, 2.25rem); }
	header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .7rem; }
	h2 { margin: 0; font-size: clamp(1.35rem, 3vw, 1.75rem); letter-spacing: -.03em; }
	.actions { display: flex; align-items: center; gap: .4rem; }
	.actions a { margin-right: .25rem; font-size: .78rem; font-weight: 700; text-decoration: none; }
	button { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--border); border-radius: .55rem; background: var(--surface-raised); color: var(--fg); }
	button:hover { border-color: var(--brand); }
	.rail { display: flex; gap: .7rem; overflow-x: auto; padding: 1px 1px .55rem; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-color: var(--border-strong) transparent; }
	.quiet { padding: 1.25rem; border: 1px dashed var(--border-strong); border-radius: var(--radius-md); color: var(--fg-muted); text-align: center; }
	@media (max-width: 36rem) { .actions button { display: none; } }
	@media (prefers-reduced-motion: reduce) { .rail { scroll-behavior: auto; } }
</style>
