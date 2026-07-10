<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		src,
		alt,
		fallback
	}: { src: string | null; alt: string; fallback: Snippet } = $props();

	let failed = $state(false);

	// Reading `src` makes the effect re-run (and reset the flag) when it changes.
	$effect(() => {
		src;
		failed = false;
	});
</script>

{#if src && !failed}
	<img {src} {alt} loading="lazy" onerror={() => (failed = true)} />
{:else}
	{@render fallback()}
{/if}
