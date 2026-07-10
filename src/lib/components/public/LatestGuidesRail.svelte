<script lang="ts">
	import CompactStrategyCard from './CompactStrategyCard.svelte';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';
	import type { PublicStrategySummary } from '$lib/types/public';

	let { strategies }: { strategies: PublicStrategySummary[] } = $props();
	let rail = $state<HTMLDivElement>();

	function scroll(direction: number): void {
		rail?.scrollBy({ left: direction * Math.min(rail.clientWidth * 0.8, 600), behavior: 'smooth' });
	}
</script>

<section class="latest page-shell" aria-labelledby="latest-guides-title">
	<header>
		<h2 id="latest-guides-title">{m.latest_guides()}</h2>
		<div class="actions">
			<a href={href('/strategies')}>{m.view_all()}</a>
			{#if strategies.length > 1}
				<button type="button" aria-label={m.prev_guides()} onclick={() => scroll(-1)}>←</button>
				<button type="button" aria-label={m.next_guides()} onclick={() => scroll(1)}>→</button>
			{/if}
		</div>
	</header>
	{#if strategies.length > 0}
		<div class="rail" bind:this={rail} aria-label={m.recent_rail_label()}>
			{#each strategies as strategy (strategy.id)}<CompactStrategyCard {strategy} />{/each}
		</div>
	{:else}
		<p class="quiet">{m.first_guides_pending()}</p>
	{/if}
</section>

<style>
	.latest { padding-block: var(--space-5) var(--space-4); }
	header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
	h2 { margin: 0; font-size: clamp(1.75rem, 3vw, 2.25rem); letter-spacing: -.03em; }
	.actions { display: flex; align-items: center; gap: var(--space-1); }
	.actions a { display: inline-flex; min-height: var(--icon-control); align-items: center; margin-right: var(--space-1); font-size: var(--text-meta); font-weight: 700; text-decoration: none; }
	button { display: grid; width: var(--icon-control); height: var(--icon-control); place-items: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-raised); color: var(--fg); transition: border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out); }
	button:hover { border-color: var(--brand); transform: translateY(-1px); }
	button:active { transform: scale(.94); }
	.rail { display: flex; gap: var(--space-3); overflow-x: auto; padding: 1px 1px var(--space-2); scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-color: var(--border-strong) transparent; }
	.quiet { padding: var(--space-4); border: 1px dashed var(--border-strong); border-radius: var(--radius-md); color: var(--fg-muted); text-align: center; }
	@media (max-width: 36rem) { .actions button { display: none; } }
	@media (prefers-reduced-motion: reduce) { .rail { scroll-behavior: auto; } }
</style>
