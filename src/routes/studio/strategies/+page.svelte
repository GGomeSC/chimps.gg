<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Strategies · chimps.gg studio</title>
</svelte:head>

<h1>Strategies</h1>
<p><a href="/studio/strategies/new">+ New strategy</a></p>

{#if form?.error}
	<p class="error">{form.error}</p>
{/if}

{#if data.strategies.length === 0}
	<p>No strategies yet.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Title</th>
				<th>Map</th>
				<th>Mode</th>
				<th>Hero</th>
				<th>Status</th>
				<th>Placements</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.strategies as s (s.id)}
				<tr>
					<td><a href="/studio/strategies/{s.id}">{s.title}</a></td>
					<td>{s.map_name}</td>
					<td>{s.mode_name}</td>
					<td>{s.hero_name ?? '—'}</td>
					<td>{s.status}</td>
					<td>{s.placement_count}</td>
					<td>
						<form
							method="POST"
							action="?/delete"
							onsubmit={(e) => {
								if (!confirm(`Delete "${s.title}" and all its placements/steps?`)) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	table {
		border-collapse: collapse;
		width: 100%;
	}

	th,
	td {
		text-align: left;
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid #eee;
	}

	.error {
		color: #b00020;
	}
</style>
