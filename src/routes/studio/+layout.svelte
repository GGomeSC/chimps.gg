<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
	const active = (path: string) => page.url.pathname.startsWith(path);
</script>

<div class="studio">
	<header class="studio-header">
		<a class="studio-brand" href="/studio">chimps.gg <span>studio</span></a>
		<nav>
			<a href="/studio/strategies" aria-current={active('/studio/strategies') ? 'page' : undefined}>Strategies</a>
			<a href="/studio/maps" aria-current={active('/studio/maps') ? 'page' : undefined}>Maps</a>
			<a href="/studio/heroes" aria-current={active('/studio/heroes') ? 'page' : undefined}>Heroes</a>
		</nav>
		<div class="right">
			<ThemeToggle />
		</div>
	</header>
	{@render children()}
</div>

<style>
	.studio {
		max-width: 80rem;
		margin: 0 auto;
		padding: 0 var(--space-4) var(--space-7);
		font-family: var(--font-body);
	}

	.studio-header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		min-height: 4.25rem;
		align-items: center;
		gap: var(--space-5);
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg) 90%, transparent);
		backdrop-filter: blur(16px);
	}

	.studio-brand { color: var(--fg); font-family: var(--font-display); font-size: 1.1rem; font-weight: 850; text-decoration: none; }
	.studio-brand span { color: var(--brand-strong); }

	nav {
		display: flex;
		gap: var(--space-1);
	}

	nav a { padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); color: var(--fg-muted); font-size: .875rem; font-weight: 700; text-decoration: none; }
	nav a:hover { color: var(--fg); }
	nav a[aria-current='page'] { background: var(--brand-soft); color: var(--fg); }

	.right {
		margin-left: auto;
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	:global(.studio h1) { margin: 0 0 var(--space-2); font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -.045em; }
	:global(.studio h2) { font-family: var(--font-display); }
	:global(.studio input), :global(.studio select), :global(.studio textarea), :global(.studio button) { min-height: 2.75rem; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-raised); color: var(--fg); }
	:global(.studio input), :global(.studio select), :global(.studio textarea) { padding: .6rem .75rem; }
	:global(.studio button) { padding: .55rem .85rem; font-weight: 700; }
	:global(.studio table) { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); }
	:global(.studio th) { color: var(--fg-muted); font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; }
	:global(.studio a) { font-weight: 650; }

	@media (max-width: 42rem) {
		.studio { padding-inline: var(--space-3); }
		.studio-header { flex-wrap: wrap; gap: var(--space-2); padding-block: var(--space-2); }
		nav { order: 3; width: 100%; overflow-x: auto; }
		nav a { flex: 1; text-align: center; }
	}

</style>
