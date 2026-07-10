<script lang="ts">
	import FallbackImage from './FallbackImage.svelte';

	type Props = {
		src: string | null;
		name: string;
		compact?: boolean;
	};

	let { src, name, compact = false }: Props = $props();
	const initials = $derived(
		name
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0])
			.join('')
			.toUpperCase()
	);
</script>

<span class:compact class="icon-shell">
	<FallbackImage {src} alt={name}>
		{#snippet fallback()}
			<span class="fallback" aria-label={`${name} image unavailable`}>{initials}</span>
		{/snippet}
	</FallbackImage>
</span>

<style>
	.icon-shell {
		display: grid;
		width: 5.5rem;
		aspect-ratio: 1;
		place-items: center;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 1.25rem;
		background: var(--surface-raised);
	}

	.icon-shell.compact {
		width: 2rem;
		border-radius: 50%;
	}

	.icon-shell :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.fallback {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		background: linear-gradient(145deg, var(--brand-soft), var(--accent-soft));
		color: var(--fg);
		font-weight: 900;
		letter-spacing: -0.04em;
	}
</style>
