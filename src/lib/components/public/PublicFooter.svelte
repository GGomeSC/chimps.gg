<footer class="site-footer">
	<div class="page-shell footer-grid">
		<div class="brand">
			<strong>chimps.gg</strong>
			<p class="legal">
				Project not affiliated with or endorsed by Ninja Kiwi. Bloons TD 6 and its
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
		margin-top: 0;
		padding: var(--space-2) 0;
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
