<script lang="ts">
	let dark = $state(false);

	$effect(() => {
		const explicit = document.documentElement.dataset.theme;
		dark = explicit ? explicit === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
	});

	function toggle() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('theme', theme);
	}
</script>

<button type="button" onclick={toggle} aria-pressed={dark} aria-label="Toggle dark mode">
	<span aria-hidden="true">{dark ? '☀' : '☾'}</span>
</button>

<style>
	button {
		display: grid;
		width: var(--icon-control, 2.75rem);
		height: var(--icon-control, 2.75rem);
		place-items: center;
		padding: 0;
		background: var(--surface-raised);
		color: var(--fg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 0.65rem);
		font: inherit;
		font-size: 1.15rem;
		line-height: 1;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--brand);
	}
</style>
