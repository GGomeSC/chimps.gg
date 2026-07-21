<script lang="ts">
	import { page } from '$app/state';
	import {
		DEFAULT_LOCALE,
		LOCALE_COOKIE,
		LOCALE_COOKIE_MAX_AGE,
		delocalizePath,
		isLocale,
		localizeHref,
		type Locale
	} from '$lib/i18n';
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

	const locale = $derived<Locale>(isLocale(page.params.lang) ? page.params.lang : DEFAULT_LOCALE);
	const otherLocale = $derived<Locale>(locale === 'pt' ? 'en' : 'pt');
	const switchHref = $derived(
		localizeHref(delocalizePath(page.url.pathname), otherLocale) + page.url.search
	);

	function rememberLocale(): void {
		document.cookie = `${LOCALE_COOKIE}=${otherLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
	}
</script>

<footer class="site-footer">
	<div class="page-shell footer-grid">
		<div class="brand">
			<strong>chimps.gg</strong>
			<p class="legal">{m.footer_disclaimer()}</p>
		</div>
		<nav aria-label={m.footer_navigation()}>
			<a href={href('/maps')}>{m.nav_maps()}</a>
			<a href={href('/strategies')}>{m.nav_strategies()}</a>
			<a href={href('/heroes')}>{m.nav_heroes()}</a>
			<a href="https://data.ninjakiwi.com/" rel="external">Ninja Kiwi Open Data</a>
			<a
				href={switchHref}
				data-sveltekit-reload
				lang={otherLocale}
				hreflang={otherLocale}
				onclick={rememberLocale}>{m.language_switch_name()}</a
			>
		</nav>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: 0;
		padding: var(--space-5) 0;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.footer-grid {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.brand {
		display: flex;
		min-width: 0;
		align-items: baseline;
		gap: var(--space-2);
	}

	strong {
		flex: none;
		font-size: 1rem;
	}

	.legal {
		max-width: 44rem;
		margin: 0;
		color: var(--fg-muted);
		font-size: var(--text-meta);
		line-height: 1.4;
	}

	nav {
		display: flex;
		flex: none;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	nav a {
		display: inline-flex;
		min-height: 2rem;
		align-items: center;
		color: inherit;
		font-size: var(--text-meta);
		font-weight: 700;
		transition: color var(--motion-fast) ease;
	}

	nav a:hover {
		color: var(--brand-strong);
	}

	@media (max-width: 52rem) {
		.footer-grid {
			align-items: flex-start;
			flex-direction: column;
			gap: var(--space-1);
		}

		.brand {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.15rem;
		}
	}
</style>
