<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	let { data } = $props();
	const number = new Intl.NumberFormat();
	const winRate = $derived(data.player.gameCount ? data.player.gamesWon / data.player.gameCount : null);
</script>
<svelte:head><title>{data.player.displayName} · chimps.gg</title></svelte:head>
<article class="profile page-shell">
	<header style:background-image={data.player.bannerUrl ? `linear-gradient(rgb(5 10 17/.55),rgb(5 10 17/.88)),url(${data.player.bannerUrl})` : undefined}>
		{#if data.player.avatarUrl}<img src={data.player.avatarUrl} alt="" />{/if}<div>{#if data.isOwn}<span>{m.players_your_profile()}</span>{/if}<h1>{data.player.displayName}</h1><p>{m.players_rank({rank:data.player.rank})}{#if data.player.veteranRank} · {m.players_veteran({rank:data.player.veteranRank})}{/if}</p></div>
	</header>
	<section class="stats" aria-label={m.players_stats()}>
		<div><strong>{number.format(data.player.bloonsPopped)}</strong><span>{m.players_bloons()}</span></div><div><strong>{number.format(data.player.highestRound)}</strong><span>{m.players_highest_round()}</span></div><div><strong>{number.format(data.player.achievements)}</strong><span>{m.players_achievements()}</span></div><div><strong>{data.player.mostExperiencedMonkey}</strong><span>{m.players_most_experienced()}</span></div><div><strong>{number.format(data.player.gameCount)}</strong><span>{m.players_games()}</span></div><div><strong>{number.format(data.player.gamesWon)}</strong><span>{m.players_wins()}</span></div>{#if winRate !== null}<div><strong>{new Intl.NumberFormat(undefined,{style:'percent',maximumFractionDigits:1}).format(winRate)}</strong><span>{m.players_game_winrate()}</span></div>{/if}
	</section>
</article>
<style>.profile{display:grid;gap:var(--space-4);padding-block:var(--space-6)}header{display:flex;min-height:14rem;align-items:flex-end;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-lg);background:linear-gradient(145deg,var(--brand-soft),var(--accent-soft));background-position:center;background-size:cover;color:white}header img{width:6rem;height:6rem;border-radius:50%;border:3px solid white}h1,p{margin:0}h1{font-family:var(--font-display);font-size:clamp(2rem,5vw,3.5rem)}header span{font-weight:850;color:var(--brand)}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--space-2)}.stats div{display:grid;gap:.25rem;padding:var(--space-3);border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface-raised)}.stats strong{font-family:var(--font-display);font-size:1.35rem;overflow-wrap:anywhere}.stats span{color:var(--fg-muted);font-size:var(--text-meta)}@media(max-width:48rem){.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:34rem){header{align-items:flex-start;flex-direction:column}.stats{grid-template-columns:1fr}}</style>
