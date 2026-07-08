<script lang="ts">
	let { data, form } = $props();

	function cancel() {
		if (history.length > 1) {
			history.back();
			return;
		}
		location.href = '/studio/strategies';
	}
</script>

<svelte:head>
	<title>New strategy · chimps.gg studio</title>
</svelte:head>

<h1>New strategy</h1>

{#if form?.error}
	<p class="error">{form.error}</p>
{/if}

<form method="POST">
	<label>
		Title
		<input name="title" required />
	</label>

	<label>
		Map
		<select name="map_id" required>
			<option value="">— select —</option>
			{#each data.maps as map (map.id)}
				<option value={map.id}>{map.name}{map.difficulty ? ` (${map.difficulty})` : ''}</option>
			{/each}
		</select>
	</label>

	<label>
		Game mode
		<select name="game_mode_id" required>
			{#each data.modes as mode (mode.id)}
				<option value={mode.id}>{mode.name}</option>
			{/each}
		</select>
	</label>

	<label>
		Hero
		<select name="hero_id">
			<option value="">— none —</option>
			{#each data.heroes as hero (hero.id)}
				<option value={hero.id}>{hero.name}</option>
			{/each}
		</select>
	</label>

	<label>
		Description
		<textarea name="description" rows="3"></textarea>
	</label>

	<label>
		Source URL
		<input name="source_url" type="url" />
	</label>

	<label>
		Verified version
		<input name="verified_version" placeholder="55.2" />
	</label>

	<label>
		Execution difficulty (1–5)
		<input name="exec_difficulty" type="number" min="1" max="5" />
	</label>

	<label>
		Status
		<select name="status">
			<option value="draft">draft</option>
			<option value="ready">ready</option>
			<option value="archived">archived</option>
		</select>
	</label>

	<div class="actions">
		<button type="submit">Create</button>
		<button type="button" onclick={cancel}>Cancel</button>
	</div>
</form>

<style>
	form {
		display: grid;
		gap: 0.75rem;
		max-width: 28rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.error {
		color: #b00020;
	}
</style>
