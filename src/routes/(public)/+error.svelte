<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} · chimps.gg</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="error-page page-shell">
	<span class="code">{page.status}</span>
	<h1>{page.status === 404 ? 'This route popped early.' : 'We hit a rough round.'}</h1>
	<p>
		{page.status === 404
			? 'The guide or page you requested is not available.'
			: 'Content is temporarily unavailable. Try the page again in a moment.'}
	</p>
	<div class="actions">
		<a class="button" href="/strategies">Browse strategies</a>
		<a class="button secondary" href="/">Back home</a>
	</div>
</section>

<style>
	.error-page {
		display: grid;
		min-height: 60vh;
		align-content: center;
		justify-items: start;
		padding-block: 4rem;
	}

	.code {
		color: var(--brand-strong);
		font-size: 4rem;
		font-weight: 950;
		letter-spacing: -0.08em;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 7vw, 4rem);
		letter-spacing: -0.06em;
	}

	p {
		max-width: 34rem;
		color: var(--fg-muted);
		font-size: 1.05rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
	}
</style>
