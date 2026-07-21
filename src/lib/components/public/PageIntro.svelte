<script lang="ts">
	let {
		title,
		headingId,
		lead
	}: {
		title: string;
		headingId?: string;
		lead?: string;
	} = $props();
</script>

<header class="page-intro">
	<h1 id={headingId}>{title}</h1>
	{#if lead}<p>{lead}</p>{/if}
</header>

<style>
	.page-intro {
		display: grid;
		gap: var(--space-2);
		max-width: 52rem;
	}

	h1 {
		margin: 0;
		font-size: var(--text-3xl);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.05em;
	}

	p {
		max-width: var(--reading-max);
		margin: 0;
		color: var(--fg-muted);
		font-size: var(--text-lead);
	}
</style>
