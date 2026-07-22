<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { href } from '$lib/link';
	let { data, form } = $props();
</script>

<svelte:head><title>{m.players_title()}</title><meta name="description" content={m.players_meta()} /></svelte:head>

<section class="players page-shell">
	<header><h1>{m.players_heading()}</h1><p>{m.players_oak_help()}</p></header>
	<form method="POST" action="?/oak" class="primary-card">
		<label for="oak">{m.players_oak_label()}</label>
		<div class="field-row"><input id="oak" name="oak" type="password" autocomplete="off" required /><button>{m.players_view_mine()}</button></div>
		<small>{m.players_oak_privacy()}</small>
		{#if form?.action === 'oak' && form?.error}<p class="error" role="alert">{form.error}</p>{/if}
	</form>

	<section class="others">
		<h2>{m.players_others()}</h2><p>{m.players_index_limit()}</p>
		<form method="GET" class="field-row"><label class="sr-only" for="nickname">{m.players_nickname()}</label><input id="nickname" name="q" value={data.q} placeholder={m.players_nickname_placeholder()} /><button>{m.players_search()}</button></form>
		{#if data.q}
			{#if data.players.length}
				<ul class="results">{#each data.players as player}<li><a href={href(`/players/${player.userId}`)}>{#if player.avatarUrl}<img src={player.avatarUrl} alt="" />{/if}<span><strong>{player.displayName}</strong><small>{m.players_rank({ rank: player.rank })} · {player.userId.slice(0, 8)}…</small></span></a></li>{/each}</ul>
			{:else}<p class="empty">{m.players_no_index_match()}</p>{/if}
		{/if}
		<details open={form?.action === 'resolve'}><summary>{m.players_id_fallback()}</summary><form method="POST" action="?/resolve" class="field-row"><label class="sr-only" for="identifier">{m.players_profile_identifier()}</label><input id="identifier" name="identifier" placeholder={m.players_id_placeholder()} required /><button>{m.players_open_profile()}</button></form>{#if form?.action === 'resolve' && form?.error}<p class="error" role="alert">{form.error}</p>{/if}</details>
	</section>
</section>

<style>
	.players{display:grid;gap:var(--space-5);max-width:56rem;padding-block:var(--space-6)} header{display:grid;gap:.5rem} h1,h2{margin:0;font-family:var(--font-display)} header p,.others>p{margin:0;color:var(--fg-muted)} .primary-card,.others{display:grid;gap:var(--space-3);padding:var(--space-4);border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface-raised);box-shadow:var(--shadow-card)} label{font-weight:800}.field-row{display:flex;gap:var(--space-2)} input{min-width:0;flex:1;min-height:var(--control-height);padding:.7rem .85rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--fg)} button{min-height:var(--control-height);padding:.65rem 1rem;border:0;border-radius:var(--radius-sm);background:var(--brand);color:white;font-weight:800} small{color:var(--fg-muted)} .error{margin:0;color:var(--danger);font-weight:700}.results{display:grid;gap:var(--space-2);margin:0;padding:0;list-style:none}.results a{display:flex;align-items:center;gap:var(--space-2);padding:.7rem;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);text-decoration:none}.results img{width:2.75rem;height:2.75rem;border-radius:50%}.results span{display:grid}.empty{padding:var(--space-3);border-radius:var(--radius-sm);background:var(--surface);color:var(--fg-muted)} details{display:grid;gap:var(--space-2)} summary{cursor:pointer;font-weight:750} details form{margin-top:var(--space-2)}@media(max-width:34rem){.field-row{flex-direction:column}}
</style>
