<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data, children } = $props();
</script>

<div class="studio">
	<header>
		<strong>chimps.gg studio</strong>
		{#if !data.isLogin}
			<nav>
				<a href="/studio/strategies">Strategies</a>
				<a href="/studio/maps">Maps</a>
			</nav>
		{/if}
		<div class="right">
			{#if !data.isLogin && data.studioUser}
				<form method="POST" action="/studio/logout" class="session">
					<span>{data.studioUser.email}</span>
					<button type="submit">Logout</button>
				</form>
			{/if}
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

	.session {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		color: var(--fg-muted);
		font-size: 0.9rem;
	}

	.session button {
		font: inherit;
	}
</style>
