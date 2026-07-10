<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>

{@render children()}
