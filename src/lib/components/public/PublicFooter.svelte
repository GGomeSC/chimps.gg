<footer class="site-footer">
	<div class="page-shell footer-grid">
		<div class="brand">
			<strong>chimps.gg</strong>
			<p>Community-curated Bloons TD 6 strategies, built for clear runs—not mystery metrics.</p>
			<p class="legal">
				Community project. Not affiliated with or endorsed by Ninja Kiwi. Bloons TD 6 and its
				assets belong to their respective owners.
			</p>
		</div>
		<nav aria-label="Footer navigation">
			<a href="/strategies">Strategies</a>
			<a href="/heroes">Heroes</a>
			<a href="https://data.ninjakiwi.com/" rel="external">Ninja Kiwi Open Data</a>
		</nav>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: clamp(2.5rem, 5vw, 4rem);
		padding: 1.75rem 0;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.footer-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) auto;
		gap: 1.5rem 4rem;
		align-items: start;
	}

	strong {
		font-size: 1.1rem;
	}

	p {
		max-width: 36rem;
		margin: 0.35rem 0 0;
		color: var(--fg-muted);
	}

	nav {
		display: grid;
		gap: 0.5rem;
	}

	nav a {
		color: inherit;
		font-weight: 700;
	}

	.legal {
		margin-top: 0.75rem;
		font-size: 0.75rem;
	}

	@media (max-width: 40rem) {
		.footer-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
