<script lang="ts">
	import PublicFooter from '$lib/components/public/PublicFooter.svelte';
	import PublicHeader from '$lib/components/public/PublicHeader.svelte';

	let { children } = $props();
</script>

<PublicHeader />
<main id="main-content">
	{@render children()}
</main>
<PublicFooter />
