<script lang="ts">
	import { navigating, page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import BrandMark from './BrandMark.svelte';

	let menuOpen = $state(false);

	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});

	function isCurrent(path: string): boolean {
		return path === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(path);
	}
</script>

<header class="site-header">
	<a class="skip-link" href="#main-content">Skip to content</a>
	<div class="nav-shell page-shell">
		<a class="brand" href="/" aria-label="chimps.gg home">
			<BrandMark />
			<span>chimps<span>.gg</span></span>
		</a>

		<button
			class="menu-button"
			type="button"
			aria-label="Toggle navigation"
			aria-expanded={menuOpen}
			aria-controls="public-navigation"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span></span><span></span><span></span>
		</button>

		<nav id="public-navigation" class:open={menuOpen} aria-label="Primary navigation">
			<a href="/" aria-current={isCurrent('/') ? 'page' : undefined}>Home</a>
			<a href="/strategies" aria-current={isCurrent('/strategies') ? 'page' : undefined}
				>Strategies</a
			>
			<a href="/heroes" aria-current={isCurrent('/heroes') ? 'page' : undefined}>Heroes</a>
			<ThemeToggle />
		</nav>
	</div>
	<div class="navigation-progress" class:active={navigating.to !== null} aria-hidden="true"></div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(16px);
	}

	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 100;
		transform: translateY(-150%);
		padding: 0.65rem 0.9rem;
		border-radius: var(--radius-sm);
		background: var(--fg);
		color: var(--bg);
	}

	.skip-link:focus {
		transform: translateY(0);
	}

	.nav-shell {
		display: flex;
		min-height: 4.5rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--fg);
		font-size: 1.25rem;
		font-weight: 950;
		letter-spacing: -0.055em;
		text-decoration: none;
	}

	.brand > span span {
		color: var(--brand-strong);
	}

	nav {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	nav > a {
		position: relative;
		padding: 0.65rem 0.8rem;
		border-radius: var(--radius-sm);
		color: var(--fg-muted);
		font-size: 0.9rem;
		font-weight: 650;
		text-decoration: none;
		transition: color 150ms ease;
	}

	nav > a:hover {
		color: var(--fg);
	}

	nav > a[aria-current='page'] {
		color: var(--fg);
	}

	nav > a[aria-current='page']::after {
		position: absolute;
		right: 0.8rem;
		bottom: 0.35rem;
		left: 0.8rem;
		height: 2px;
		border-radius: 2px;
		background: var(--brand);
		content: '';
	}

	.menu-button {
		display: none;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0.65rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface-raised);
	}

	.menu-button span {
		display: block;
		height: 2px;
		margin: 0.2rem 0;
		border-radius: 2px;
		background: var(--fg);
	}

	.navigation-progress {
		position: absolute;
		right: 100%;
		bottom: -1px;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--brand), var(--accent));
		opacity: 0;
	}

	.navigation-progress.active {
		right: 15%;
		opacity: 1;
		transition: right 800ms ease;
	}

	@media (max-width: 44rem) {
		.menu-button {
			display: block;
		}

		nav {
			position: absolute;
			top: calc(100% + 0.5rem);
			right: 1rem;
			left: 1rem;
			display: none;
			align-items: stretch;
			padding: 0.75rem;
			border: 1px solid var(--border);
			border-radius: var(--radius-lg);
			background: var(--surface-raised);
			box-shadow: var(--shadow-card-hover);
		}

		nav.open {
			display: grid;
		}

		nav > a {
			min-height: 2.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navigation-progress.active {
			transition: none;
		}
	}
</style>
