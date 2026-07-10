<script lang="ts">
	let {
		title,
		message,
		href,
		linkLabel
	}: { title: string; message: string; href?: string; linkLabel?: string } = $props();
</script>

<section class="empty-state">
	<span aria-hidden="true">◎</span>
	<h2>{title}</h2>
	<p>{message}</p>
	{#if href && linkLabel}
		<a class="button secondary" {href}>{linkLabel}</a>
	{/if}
</section>

<style>
	.empty-state {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		padding: clamp(2.5rem, 8vw, 4.5rem) var(--space-4);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		background: var(--surface);
		text-align: center;
	}

	span {
		color: var(--brand);
		font-size: 2.5rem;
	}

	h2,
	p {
		margin: 0;
	}

	p {
		max-width: 34rem;
		color: var(--fg-muted);
		font-size: var(--text-body);
		line-height: 1.6;
	}
</style>
