<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicHeader from '$lib/components/public/PublicHeader.svelte';

	let { children, data } = $props();

	onNavigate((navigation) => {
		if (
			!document.startViewTransition ||
			matchMedia('(prefers-reduced-motion: reduce)').matches ||
			!navigation.from?.route.id?.includes('/(public)') ||
			!navigation.to?.route.id?.includes('/(public)') ||
			navigation.from?.url.pathname === navigation.to?.url.pathname
		) {
			return;
		}

		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	{#each data.alternates as alternate (alternate.locale)}
		<link rel="alternate" hreflang={alternate.locale} href={alternate.href} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={data.xDefault} />
</svelte:head>

<div class="public-site">
	<PublicHeader />
	<main id="main-content">
		{@render children()}
	</main>
	<PublicFooter />
</div>
