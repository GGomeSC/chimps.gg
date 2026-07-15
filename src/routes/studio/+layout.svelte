<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<div class="studio">
	<header>
		<strong>chimps.gg studio</strong>
		<nav>
			<a href="/studio/strategies">Strategies</a>
			<a href="/studio/maps">Maps</a>
			<a href="/studio/heroes">Heroes</a>
		</nav>
		<div class="right">
			<ThemeToggle />
		</div>
	</header>
	{@render children()}
</div>

<style>
	.studio {
		max-width: 72rem;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
	}

	header {
		display: flex;
		align-items: baseline;
		gap: 1.5rem;
		padding-bottom: 0.75rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	nav {
		display: flex;
		gap: 1rem;
	}

	.right {
		margin-left: auto;
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

</style>
