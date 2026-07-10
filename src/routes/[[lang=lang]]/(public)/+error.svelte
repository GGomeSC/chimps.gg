<script lang="ts">
	import { page } from '$app/state';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{page.status === 404 ? m.error_404_title() : m.error_500_title()} · chimps.gg</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="error-page page-shell">
	<span class="code">{page.status}</span>
	<h1>{page.status === 404 ? m.error_404_heading() : m.error_500_heading()}</h1>
	<p>
		{page.status === 404 ? m.error_404_message() : m.error_500_message()}
	</p>
	<div class="actions">
		<a class="button" href={href('/strategies')}>{m.browse_strategies()}</a>
		<a class="button secondary" href={href('/')}>{m.back_home()}</a>
	</div>
</section>

<style>
	.error-page {
		display: grid;
		min-height: 60vh;
		align-content: center;
		justify-items: start;
		margin-block: var(--space-5);
		padding: clamp(2rem, 6vw, 4rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		box-shadow: var(--shadow-card);
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
		font-size: var(--text-lead);
		line-height: 1.6;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}
</style>
