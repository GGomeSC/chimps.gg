<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	type Props = { value: number | null; label?: string };
	let { value, label = m.execution_difficulty() }: Props = $props();

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
	aria-label={value === null ? m.pips_not_rated({ label }) : m.pips_value({ label, value })}
	title={value === null ? m.execution_not_rated_title() : m.execution_value_title({ value })}
>
	{#each BLOONS as color, index}
		<span
			class="bloon"
			class:dim={value === null || index >= value}
			style:background={color}
		></span>
	{/each}
	<small>{value === null ? m.unrated() : `${value}/5`}</small>
</span>

<style>
	.bloon-scale {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bloon {
		width: 0.65rem;
		height: 0.8rem;
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
		font-size: var(--text-meta, 0.7rem);
		font-variant-numeric: tabular-nums;
	}
</style>
