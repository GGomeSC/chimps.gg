<script lang="ts">
	type Props = { value: number | null; label?: string };
	let { value, label = 'Execution difficulty' }: Props = $props();
</script>

{#if value === null}
	<span class="unrated">Not rated</span>
{:else}
	<span class="difficulty" aria-label={`${label}: ${value} out of 5`} title={`${value} out of 5`}>
		{#each Array(5) as _, index}
			<span class:filled={index < value}></span>
		{/each}
	</span>
{/if}

<style>
	.difficulty {
		display: inline-flex;
		gap: 0.2rem;
	}

	.difficulty span {
		width: 0.45rem;
		height: 0.8rem;
		transform: skew(-8deg);
		border-radius: 0.15rem;
		background: var(--border-strong);
	}

	.difficulty span.filled {
		background: var(--accent);
	}

	.unrated {
		color: var(--fg-muted);
		font-size: 0.85rem;
	}
</style>
