<script lang="ts">
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
			{#if data.studioUser}
				<form method="POST" action="/studio/logout" class="session">
					<span>{data.studioUser.email}</span>
					<button type="submit">Logout</button>
				</form>
			{/if}
		{/if}
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

	.session {
		margin-left: auto;
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		color: #555;
		font-size: 0.9rem;
	}

	.session button {
		font: inherit;
	}
</style>
