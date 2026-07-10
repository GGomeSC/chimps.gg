<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicHeader from '$lib/components/public/PublicHeader.svelte';

	let { children } = $props();

	onNavigate((navigation) => {
		if (
			!document.startViewTransition ||
			matchMedia('(prefers-reduced-motion: reduce)').matches ||
			!navigation.from?.route.id?.startsWith('/(public)') ||
			!navigation.to?.route.id?.startsWith('/(public)') ||
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

<div class="public-site">
	<PublicHeader />
	<main id="main-content">
		{@render children()}
	</main>
	<PublicFooter />
</div>
