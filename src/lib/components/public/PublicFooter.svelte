<footer class="site-footer">
	<div class="page-shell footer-grid">
		<div>
			<strong>chimps.gg</strong>
			<p>Community-curated Bloons TD 6 strategies, built for clear runs—not mystery metrics.</p>
		</div>
		<nav aria-label="Footer navigation">
			<a href="/strategies">Strategies</a>
			<a href="/heroes">Heroes</a>
			<a href="https://data.ninjakiwi.com/" rel="external">Ninja Kiwi Open Data</a>
		</nav>
		<p class="legal">
			Community project. Not affiliated with or endorsed by Ninja Kiwi. Bloons TD 6 and its
			assets belong to their respective owners.
		</p>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: clamp(4rem, 9vw, 7rem);
		padding: 3rem 0;
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.footer-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) auto;
		gap: 2rem 4rem;
	}

	strong {
		font-size: 1.2rem;
	}

	p {
		max-width: 36rem;
		margin: 0.5rem 0 0;
		color: var(--fg-muted);
	}

	nav {
		display: grid;
		gap: 0.55rem;
	}

	nav a {
		color: inherit;
		font-weight: 700;
	}

	.legal {
		grid-column: 1 / -1;
		font-size: 0.75rem;
	}

	@media (max-width: 40rem) {
		.footer-grid {
			grid-template-columns: 1fr;
		}

		.legal {
			grid-column: auto;
		}
	}
</style>
