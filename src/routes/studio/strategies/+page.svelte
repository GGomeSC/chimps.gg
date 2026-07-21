<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Strategies · chimps.gg studio</title>
</svelte:head>

<div class="heading">
	<div><h1>Strategies</h1><p>Manage build orders, placements, and publishing status.</p></div>
	<a class="create" href="/studio/strategies/new">+ New strategy</a>
</div>

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
	.heading { display: flex; align-items: end; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-5); }
	.heading h1, .heading p { margin: 0; }
	.heading p { color: var(--fg-muted); }
	.create { display: inline-flex; min-height: 2.75rem; align-items: center; padding: 0 var(--space-3); border-radius: var(--radius-sm); background: var(--brand); color: var(--ink); text-decoration: none; }
	table {
		border-collapse: collapse;
		width: 100%;
	}

	th,
	td {
		text-align: left;
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.error {
		color: var(--error);
	}
</style>
