<script lang="ts">
	let { children } = $props();
</script>

<div class="studio">
	<header>
		<strong>chimps.gg studio</strong>
		<nav>
			<a href="/studio/strategies">Strategies</a>
			<a href="/studio/maps">Maps</a>
		</nav>
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
		border-bottom: 1px solid #ddd;
	}

	nav {
		display: flex;
		gap: 1rem;
	}
</style>
