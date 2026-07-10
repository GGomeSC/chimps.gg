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
	{dark ? '☀️' : '🌙'}
</button>

<style>
	button {
		font: inherit;
		line-height: 1;
		padding: 0.2rem 0.45rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 0.4rem;
		cursor: pointer;
	}
</style>
