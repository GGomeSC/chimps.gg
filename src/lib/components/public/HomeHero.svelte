<script lang="ts">
	import { href } from '$lib/link';
	import { m } from '$lib/paraglide/messages.js';

	let { guideCount, mapCount }: { guideCount: number; mapCount: number } = $props();
</script>

<section class="home-hero page-shell" aria-labelledby="home-heading">
	<div class="copy">
		<span class="eyebrow">{m.home_eyebrow()}</span>
		<h1 id="home-heading">{m.home_heading()}</h1>
		<p>{m.home_lead()}</p>
		<form action={href('/strategies')} method="GET" role="search">
			<label class="sr-only" for="home-search">{m.home_search_label()}</label>
			<input id="home-search" name="q" type="search" placeholder={m.home_search_placeholder()} />
			<button class="button" type="submit">{m.home_search_action()}</button>
		</form>
		<a class="browse" href={href('/strategies')}>{m.home_browse_action()} <span aria-hidden="true">→</span></a>
	</div>
	<div class="proof" aria-label={m.home_eyebrow()}>
		<div><strong>{guideCount}</strong><span>{m.home_guides_stat()}</span></div>
		<div><strong>{mapCount}</strong><span>{m.home_maps_stat()}</span></div>
	</div>
</section>

<style>
	.home-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-7);
		align-items: end;
		padding-block: var(--space-8) var(--space-7);
	}

	.copy { max-width: 52rem; }
	.eyebrow { color: var(--brand-strong); font-size: var(--text-meta); font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
	h1 { max-width: 50rem; margin: var(--space-2) 0 var(--space-3); font-size: clamp(2.75rem, 7vw, 5.25rem); font-weight: 800; line-height: .96; letter-spacing: -.065em; }
	p { max-width: var(--reading-max); margin: 0; color: var(--fg-muted); font-size: var(--text-lead); line-height: 1.65; }
	form { display: flex; max-width: 40rem; gap: var(--space-2); margin-top: var(--space-5); }
	input { width: 100%; min-height: var(--control-height); padding: 0 var(--space-4); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-raised); color: var(--fg); box-shadow: var(--shadow-card); }
	input:focus { border-color: var(--brand); outline: none; box-shadow: var(--glow-brand); }
	.browse { display: inline-flex; gap: var(--space-2); margin-top: var(--space-3); font-size: var(--text-meta); font-weight: 750; text-decoration: none; }
	.proof { display: grid; grid-template-columns: repeat(2, minmax(8rem, 1fr)); border-block: 1px solid var(--border); }
	.proof div { display: grid; gap: var(--space-1); padding: var(--space-4); }
	.proof strong { font-family: var(--font-display); font-size: 2rem; line-height: 1; }
	.proof span { color: var(--fg-muted); font-size: var(--text-meta); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

	@media (max-width: 48rem) {
		.home-hero { grid-template-columns: 1fr; gap: var(--space-5); padding-block: var(--space-7) var(--space-6); }
		.proof { max-width: 22rem; }
	}

	@media (max-width: 32rem) {
		form { display: grid; }
	}
</style>
