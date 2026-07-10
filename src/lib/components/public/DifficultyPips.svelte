<script lang="ts">
	type Props = { value: number | null; label?: string };
	let { value, label = 'Execution difficulty' }: Props = $props();

	// The game's own bloon progression: red → blue → green → yellow → pink.
	const BLOONS = [
		'var(--bloon-red)',
		'var(--bloon-blue)',
		'var(--bloon-green)',
		'var(--bloon-yellow)',
		'var(--bloon-pink)'
	];
</script>

<span
	class="bloon-scale"
	role="img"
	aria-label={value === null ? `${label}: not rated` : `${label}: ${value} out of 5`}
	title={value === null ? 'Execution not rated' : `Execution ${value} / 5`}
>
	{#each BLOONS as color, index}
		<span
			class="bloon"
			class:dim={value === null || index >= value}
			style:background={color}
		></span>
	{/each}
	<small>{value === null ? 'unrated' : `${value}/5`}</small>
</span>

<style>
	.bloon-scale {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}

	.bloon {
		width: 0.55rem;
		height: 0.7rem;
		border-radius: 50% 50% 50% 50% / 44% 44% 56% 56%;
		box-shadow:
			inset -1px -2px 2px rgb(0 0 0 / 0.25),
			inset 1px 1px 2px rgb(255 255 255 / 0.35);
	}

	.bloon.dim {
		opacity: 0.18;
		box-shadow: none;
	}

	small {
		margin-left: 0.3rem;
		color: var(--fg-muted);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
	}
</style>
