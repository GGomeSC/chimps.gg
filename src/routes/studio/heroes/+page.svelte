<script lang="ts">
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Heroes · chimps.gg studio</title>
</svelte:head>

<div class="heading">
	<div>
		<h1>Heroes</h1>
		<p>Curate the public profile facts and editorial tower synergies.</p>
	</div>
</div>

<ul class="hero-grid">
	{#each data.heroes as hero (hero.id)}
		<li>
			<EntityIcon src={hero.iconUrl} name={hero.name} compact />
			<div>
				<strong>{hero.name}</strong>
				<span>{hero.completedFields}/{hero.totalFields} fields · {hero.synergyCount} synergies</span>
			</div>
			<a href="/studio/heroes/{hero.id}">Edit</a>
		</li>
	{/each}
</ul>

<style>
	.heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	h1,
	p { margin: 0; }
	p { color: var(--fg-muted); }

	.hero-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 0.75rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem;
		border: 1px solid var(--border);
		border-radius: 0.65rem;
		background: var(--surface-raised);
	}

	li > div {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	li strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li span {
		color: var(--fg-muted);
		font-size: 0.82rem;
	}
</style>
