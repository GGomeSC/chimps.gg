<script lang="ts">
	import StrategyMap from '$lib/components/StrategyMap.svelte';
	import type { PlacementRow } from '$lib/types/db';

	let { data, form } = $props();

	const map = $derived(data.maps.find((m) => m.id === data.strategy.map_id));
	const heroes = $derived(data.towers.filter((t) => t.category === 'Hero'));
	const strategyHero = $derived(data.towers.find((t) => t.id === data.strategy.hero_id) ?? null);

	const CATEGORY_ORDER = ['Hero', 'Primary', 'Military', 'Magic', 'Support'] as const;
	// The Hero palette group offers only the strategy's own hero.
	const palette = $derived(
		CATEGORY_ORDER.map((category) => ({
			category,
			towers:
				category === 'Hero'
					? strategyHero
						? [strategyHero]
						: []
					: data.towers.filter((t) => t.category === category)
		})).filter((group) => group.towers.length > 0)
	);

	// Local copy so pointer interactions mutate without a full page invalidate;
	// every mutation is already persisted through the JSON endpoints.
	let placements = $state<PlacementRow[]>([]);
	$effect(() => {
		placements = [...data.placements];
	});

	let activeTowerId = $state<number | null>(null);
	let selectedId = $state<number | null>(null);
	// Renders the shared component in read-only mode, as the public site will.
	let preview = $state(false);
	let apiError = $state<string | null>(null);
	let editPath = $state('');
	let editLabel = $state('');
	let editNotes = $state('');

	const selected = $derived(placements.find((p) => p.id === selectedId) ?? null);
	const selectedTower = $derived(selected ? requireTower(selected.tower_id) : null);

	async function api<T>(path: string, method: string, body?: unknown): Promise<T | null> {
		apiError = null;
		const response = await fetch(path, {
			method,
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			apiError = payload?.message ?? `Request failed (${response.status})`;
			return null;
		}
		return response.status === 204 ? (true as T) : ((await response.json()) as T);
	}

	function selectPlacement(id: number | null) {
		selectedId = id;
		const placement = placements.find((p) => p.id === id);
		editPath = placement?.final_path ?? '';
		editLabel = placement?.label ?? '';
		editNotes = placement?.notes ?? '';
	}

	async function addPlacement(pos: { x: number; y: number }) {
		if (!activeTowerId) return;
		const created = await api<PlacementRow>(
			`/studio/strategies/${data.strategy.id}/placements`,
			'POST',
			{ tower_id: activeTowerId, pos_x: pos.x, pos_y: pos.y }
		);
		if (created) {
			placements.push(created);
			selectPlacement(created.id);
		}
	}

	async function movePlacement(id: number, pos: { x: number; y: number }) {
		const previous = placements.find((p) => p.id === id);
		if (!previous) return;

		replaceLocal({ ...previous, pos_x: pos.x, pos_y: pos.y });

		const updated = await api<PlacementRow>(
			`/studio/strategies/${data.strategy.id}/placements/${id}`,
			'PATCH',
			{ pos_x: pos.x, pos_y: pos.y }
		);
		replaceLocal(updated ?? previous);
	}

	async function saveSelected() {
		if (!selected) return;
		const updated = await api<PlacementRow>(
			`/studio/strategies/${data.strategy.id}/placements/${selected.id}`,
			'PATCH',
			{ final_path: editPath.trim() || null, label: editLabel.trim() || null, notes: editNotes.trim() || null }
		);
		if (updated) replaceLocal(updated);
	}

	async function deleteSelected() {
		if (!selected) return;
		if (!confirm('Delete this placement? Steps referencing it are deleted too.')) return;
		const ok = await api<boolean>(
			`/studio/strategies/${data.strategy.id}/placements/${selected.id}`,
			'DELETE'
		);
		if (ok) {
			placements = placements.filter((p) => p.id !== selected!.id);
			selectPlacement(null);
		}
	}

	function replaceLocal(updated: PlacementRow) {
		placements = placements.map((p) => (p.id === updated.id ? updated : p));
	}

	function requireTower(towerId: number) {
		const tower = data.towers.find((t) => t.id === towerId);
		if (!tower) throw new Error(`Missing tower ${towerId}`);
		return tower;
	}

	function placementLabel(placement: PlacementRow): string {
		const tower = requireTower(placement.tower_id);
		const name = placement.label ?? tower.name;
		return `#${placement.id} ${name}`;
	}
</script>

<svelte:head>
	<title>{data.strategy.title} · chimps.gg studio</title>
</svelte:head>

<h1>{data.strategy.title}</h1>
<p class="meta">{map?.name} · strategy #{data.strategy.id}</p>

{#if form?.error}
	<p class="error">{form.error}</p>
{:else if form?.saved}
	<p class="ok">Saved.</p>
{/if}

<details>
	<summary><h2>Metadata</h2></summary>
	<form method="POST" action="?/updateMeta">
		<label>
			Title
			<input name="title" required value={data.strategy.title} />
		</label>

		<label>
			Map
			<select name="map_id" required>
				{#each data.maps as m (m.id)}
					<option value={m.id} selected={m.id === data.strategy.map_id}>
						{m.name}{m.difficulty ? ` (${m.difficulty})` : ''}
					</option>
				{/each}
			</select>
		</label>

		<label>
			Game mode
			<select name="game_mode_id" required>
				{#each data.modes as mode (mode.id)}
					<option value={mode.id} selected={mode.id === data.strategy.game_mode_id}>{mode.name}</option>
				{/each}
			</select>
		</label>

		<label>
			Hero
			<select name="hero_id">
				<option value="">— none —</option>
				{#each heroes as hero (hero.id)}
					<option value={hero.id} selected={hero.id === data.strategy.hero_id}>{hero.name}</option>
				{/each}
			</select>
		</label>

		<label>
			Description
			<textarea name="description" rows="3">{data.strategy.description ?? ''}</textarea>
		</label>

		<label>
			Source URL
			<input name="source_url" type="url" value={data.strategy.source_url ?? ''} />
		</label>

		<label>
			Verified version
			<input name="verified_version" value={data.strategy.verified_version ?? ''} />
		</label>

		<label>
			Execution difficulty (1–5)
			<input name="exec_difficulty" type="number" min="1" max="5" value={data.strategy.exec_difficulty ?? ''} />
		</label>

		<label>
			Status
			<select name="status">
				{#each ['draft', 'ready', 'archived'] as status (status)}
					<option value={status} selected={status === data.strategy.status}>{status}</option>
				{/each}
			</select>
		</label>

		<button type="submit">Save metadata</button>
	</form>
</details>

<section>
	<h2>Layout</h2>
	<label class="preview-toggle">
		<input type="checkbox" bind:checked={preview} />
		Preview (read-only view mode)
	</label>
	{#if apiError}
		<p class="error">{apiError}</p>
	{/if}
	<div class="layout" class:preview>
		<div class="palette" hidden={preview}>
			{#each palette as group (group.category)}
				<h3>{group.category}</h3>
				<div class="palette-group">
					{#each group.towers as tower (tower.id)}
						<button
							type="button"
							class:active={tower.id === activeTowerId}
							title={tower.name}
							aria-label={tower.name}
							onclick={() => (activeTowerId = activeTowerId === tower.id ? null : tower.id)}
						>
							<img src={tower.icon_url} alt="" draggable="false" />
							<span class="sr-only">{tower.name}</span>
						</button>
					{/each}
				</div>
			{/each}
			{#if !strategyHero}
				<p class="meta">Pick a hero in metadata to place it on the map.</p>
			{/if}
		</div>

		<StrategyMap
			imageUrl={map?.image_url ?? map?.nk_image_url ?? null}
			{placements}
			towers={data.towers}
			mode={preview ? 'view' : 'edit'}
			selectedId={preview ? null : selectedId}
			canPlace={!preview && activeTowerId !== null}
			onadd={addPlacement}
			onmove={movePlacement}
			onselect={selectPlacement}
		/>

		<div class="panel" hidden={preview}>
			{#if selected}
				<h3>{selectedTower?.name}</h3>
				{#if selectedTower?.category !== 'Hero'}
					<label>
						Crosspath
						<input bind:value={editPath} placeholder="2-0-5" />
					</label>
				{/if}
				<label>
					Label
					<input bind:value={editLabel} maxlength="12" placeholder="e.g. Sniper 1" />
				</label>
				<label>
					Notes
					<textarea bind:value={editNotes} rows="3"></textarea>
				</label>
				<div class="panel-actions">
					<button type="button" onclick={saveSelected}>Save placement</button>
					<button type="button" class="danger" onclick={deleteSelected}>Delete</button>
				</div>
			{:else}
				<p class="meta">
					Pick a tower in the palette and click the map to place it. Click a marker to edit it;
					drag to move.
				</p>
			{/if}
		</div>
	</div>
</section>

<section>
	<h2>Build order</h2>

	{#if data.steps.length > 0}
		<table class="steps">
			<thead>
				<tr>
					<th></th>
					<th>#</th>
					<th>Round</th>
					<th>Action</th>
					<th>Placement</th>
					<th>Path</th>
					<th>Description</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.steps as step, index (step.id)}
					<tr>
						<td class="move">
							<form method="POST" action="?/moveStep">
								<input type="hidden" name="step_id" value={step.id} />
								<input type="hidden" name="direction" value="up" />
								<button type="submit" disabled={index === 0} title="Move up">↑</button>
							</form>
							<form method="POST" action="?/moveStep">
								<input type="hidden" name="step_id" value={step.id} />
								<input type="hidden" name="direction" value="down" />
								<button type="submit" disabled={index === data.steps.length - 1} title="Move down">↓</button>
							</form>
						</td>
						<td>{step.order_index}</td>
						<td>
							<input
								form="step-{step.id}"
								name="round_number"
								type="number"
								min="1"
								max="200"
								required
								value={step.round_number}
								class="narrow"
							/>
						</td>
						<td>
							<select form="step-{step.id}" name="action">
								{#each ['place', 'upgrade', 'sell', 'retarget', 'other'] as action (action)}
									<option value={action} selected={action === step.action}>{action}</option>
								{/each}
							</select>
						</td>
						<td>
							<select form="step-{step.id}" name="placement_id">
								<option value="">—</option>
								{#each placements as placement (placement.id)}
									<option value={placement.id} selected={placement.id === step.placement_id}>
										{placementLabel(placement)}
									</option>
								{/each}
							</select>
						</td>
						<td>
							<input
								form="step-{step.id}"
								name="target_path"
								value={step.target_path ?? ''}
								placeholder="0-0-0"
								class="narrow"
							/>
						</td>
						<td>
							<input form="step-{step.id}" name="description" value={step.description ?? ''} />
						</td>
						<td class="row-actions">
							<form id="step-{step.id}" method="POST" action="?/updateStep">
								<input type="hidden" name="step_id" value={step.id} />
								<button type="submit">Save</button>
							</form>
							<form method="POST" action="?/deleteStep">
								<input type="hidden" name="step_id" value={step.id} />
								<button type="submit" class="danger" title="Delete step">✕</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="meta">No steps yet.</p>
	{/if}

	<form method="POST" action="?/addStep" class="step-add">
		<label>
			Round
			<input name="round_number" type="number" min="1" max="200" required class="narrow" />
		</label>
		<label>
			Action
			<select name="action">
				{#each ['place', 'upgrade', 'sell', 'retarget', 'other'] as action (action)}
					<option value={action}>{action}</option>
				{/each}
			</select>
		</label>
		<label>
			Placement
			<select name="placement_id">
				<option value="">—</option>
				{#each placements as placement (placement.id)}
					<option value={placement.id}>{placementLabel(placement)}</option>
				{/each}
			</select>
		</label>
		<label>
			Path
			<input name="target_path" placeholder="0-0-0" class="narrow" />
		</label>
		<label>
			Description
			<input name="description" />
		</label>
		<button type="submit">Add step</button>
	</form>
</section>

<style>
	summary h2 {
		display: inline;
	}

	form {
		display: grid;
		gap: 0.75rem;
		max-width: 28rem;
		margin-top: 0.75rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
	}

	.layout {
		display: grid;
		grid-template-columns: 12rem minmax(0, 1fr) 16rem;
		gap: 1rem;
		align-items: start;
	}

	.layout.preview {
		grid-template-columns: minmax(0, 1fr);
	}

	.preview-toggle {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.palette h3 {
		margin: 0.4rem 0 0.2rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #666;
	}

	.palette-group {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(1.85rem, 1fr));
		gap: 0.2rem;
	}

	.palette-group button {
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		padding: 0.15rem;
	}

	.palette-group img {
		width: 1.35rem;
		height: 1.35rem;
		object-fit: contain;
	}

	.palette-group button.active {
		background: #111;
		color: white;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.panel {
		display: grid;
		gap: 0.5rem;
	}

	.panel-actions {
		display: flex;
		gap: 0.5rem;
	}

	.danger {
		color: #b00020;
	}

	.meta {
		color: #666;
	}

	.error {
		color: #b00020;
	}

	.ok {
		color: #1b7f3b;
	}

	.steps {
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	.steps th,
	.steps td {
		text-align: left;
		padding: 0.25rem 0.4rem;
		border-bottom: 1px solid #eee;
	}

	.move {
		white-space: nowrap;
	}

	.move form,
	.row-actions form {
		display: inline;
	}

	.narrow {
		width: 4.5rem;
	}

	.step-add {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: end;
		max-width: none;
	}
</style>
