<script lang="ts">
	let { href, parent, current }: { href: string; parent: string; current: string } = $props();
</script>

<nav class="breadcrumbs" aria-label="Breadcrumb">
	<a {href}>{parent}</a>
	<span aria-hidden="true">/</span>
	<span aria-current="page">{current}</span>
</nav>

<style>
	.breadcrumbs { display: flex; min-height: var(--control-sm); align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); color: var(--fg-muted); font-size: var(--text-meta); }
	a { color: var(--fg-muted); font-weight: 700; text-decoration: none; }
	a:hover { color: var(--brand-strong); }
	span[aria-current='page'] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
