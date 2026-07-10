<script lang="ts">
	let {
		title,
		headingId
	}: {
		title: string;
		headingId?: string;
	} = $props();
</script>

<header class="page-intro">
	<h1 id={headingId}>{title}</h1>
</header>

<style>
	.page-intro {
		padding: var(--space-4);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(115deg, color-mix(in srgb, var(--brand-soft) 54%, transparent), transparent 58%),
			var(--surface-raised);
		box-shadow: var(--shadow-card);
	}

	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 5vw, 3.6rem);
		font-weight: 820;
		line-height: 1;
		letter-spacing: -0.05em;
	}

	@media (max-width: 40rem) {
		.page-intro {
			padding: var(--space-3);
		}
	}
</style>
