<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Maps · chimps.gg studio</title>
</svelte:head>

<h1>Maps</h1>
<p class="meta">
	{data.maps.length} map{data.maps.length === 1 ? '' : 's'} synced from the Ninja Kiwi Open Data
	API. Run <code>npm run sync:maps</code> to refresh.
</p>

{#if data.maps.length === 0}
	<p>No maps yet.</p>
{:else}
	<ul class="grid">
		{#each data.maps as map (map.id)}
			<li>
				{#if map.nk_image_url}
					<img src={map.nk_image_url} alt={map.name} loading="lazy" />
				{/if}
				<strong>{map.name}</strong>
				<span class="meta">{map.difficulty ?? 'unknown difficulty'} · {map.nk_map_id}</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 1rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	img {
		width: 100%;
		border-radius: 0.5rem;
	}

	.meta {
		color: var(--fg-muted);
		font-size: 0.85rem;
	}
</style>
