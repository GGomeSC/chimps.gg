<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque/index.css';
	import '@fontsource-variable/jetbrains-mono/index.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>

{@render children()}
