<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<main>
	<header>
		<h1>chimps.gg</h1>
		<ThemeToggle />
	</header>
	<p>Public site comes later. Internal tooling lives under <a href="/studio/maps">/studio</a>.</p>
	<p><strong>Note:</strong> /studio is restricted to allowlisted Supabase Auth users.</p>
</main>

<style>
	main {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
</style>
