<script lang="ts">
	import EntityIcon from '$lib/components/public/EntityIcon.svelte';
	type SubmittedValues = {
		description: string;
		baseCost: string;
		attackStyle: string;
		xpRatio: string;
		technicalDescription: string;
		profileSourceUrl: string;
		synergyTowerIds: string[];
		synergyDescriptions: Record<string, string>;
	};

	let { data, form } = $props();
	const submitted = $derived(
		form && 'values' in form ? (form.values as SubmittedValues) : undefined
	);

	function value(key: 'description' | 'baseCost' | 'attackStyle' | 'xpRatio' | 'technicalDescription' | 'profileSourceUrl') {
		return submitted?.[key] ?? data.hero[key] ?? '';
	}

	function synergySelected(id: number) {
		const ids = submitted?.synergyTowerIds ?? data.hero.synergies.map((synergy) => String(synergy.towerId));
		return ids.includes(String(id));
	}

	function synergyDescription(id: number) {
		const key = String(id);
		return (
			submitted?.synergyDescriptions[key] ??
			data.hero.synergies.find((synergy) => synergy.towerId === id)?.description ??
			''
		);
	}
</script>

<svelte:head>
	<title>{data.hero.name} · chimps.gg studio</title>
</svelte:head>

<a href="/studio/heroes">← All heroes</a>

<div class="hero-heading">
	<EntityIcon src={data.hero.iconUrl} name={data.hero.name} />
	<div>
		<h1>{data.hero.name}</h1>
		<a href="/heroes/{data.hero.id}" target="_blank" rel="noreferrer">Open public profile ↗</a>
	</div>
</div>

{#if form?.error}<p class="notice error" role="alert">{form.error}</p>{/if}
{#if form?.success}<p class="notice success" role="status">Hero profile saved.</p>{/if}

<form method="POST">
	<section>
		<h2>Profile content</h2>

		<label>
			Short description
			<textarea name="description" rows="3">{value('description')}</textarea>
			<small>Concise English summary shown below the hero name.</small>
		</label>

		<div class="field-row">
			<label>
				Base cost (Medium)
				<input name="base_cost" type="number" min="0" step="1" value={value('baseCost')} />
			</label>
			<label>
				XP ratio
				<input name="xp_ratio" type="number" min="0.001" max="99.999" step="0.001" value={value('xpRatio')} />
			</label>
		</div>

		<label>
			Attack style
			<input name="attack_style" value={value('attackStyle')} placeholder="Melee · Slashing" />
		</label>

		<label>
			Technical description
			<textarea name="technical_description" rows="7">{value('technicalDescription')}</textarea>
			<small>Plain text only. The public site preserves line breaks and does not render HTML.</small>
		</label>

		<label>
			Source URL
			<input name="profile_source_url" type="url" value={value('profileSourceUrl')} placeholder="https://…" />
		</label>
	</section>

	<section>
		<h2>Tower synergies</h2>
		<p class="meta">Editorial pairings only — these are not inferred performance metrics.</p>
		<div class="tower-groups">
			{#each data.towerGroups as group (group.category)}
				<fieldset>
					<legend>{group.category}</legend>
					{#each group.towers as tower (tower.id)}
						<div class="synergy-option">
							<label class="check">
								<input
									type="checkbox"
									name="synergy_tower_ids"
									value={tower.id}
									checked={synergySelected(tower.id)}
								/>
								<span>{tower.name}</span>
							</label>
							<textarea
								name="synergy_description_{tower.id}"
								rows="2"
								placeholder="Optional: explain why this pairing works"
							>{synergyDescription(tower.id)}</textarea>
						</div>
					{/each}
				</fieldset>
			{/each}
		</div>
	</section>

	<div class="actions">
		<button type="submit">Save profile</button>
		<a href="/studio/heroes">Cancel</a>
	</div>
	<p class="meta">The public profile may take up to five minutes to refresh because it is served through ISR.</p>
</form>

<style>
	.hero-heading {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1rem 0 1.5rem;
	}

	h1,
	h2,
	p { margin-top: 0; }
	h1 { margin-bottom: 0.2rem; }

	form {
		display: grid;
		gap: 1rem;
		max-width: 52rem;
	}

	section {
		display: grid;
		gap: 0.9rem;
		padding: 1.1rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--surface-raised);
	}

	section h2 { margin-bottom: 0; }

	label {
		display: grid;
		gap: 0.3rem;
		font-weight: 650;
	}

	input,
	textarea {
		font: inherit;
	}

	textarea { resize: vertical; }

	small,
	.meta {
		color: var(--fg-muted);
		font-size: 0.82rem;
		font-weight: 400;
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.tower-groups {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	fieldset {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}

	legend { font-weight: 750; }

	.check {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-weight: 400;
	}

	.synergy-option {
		display: grid;
		gap: 0.35rem;
	}

	.synergy-option textarea {
		display: none;
		margin: 0 0 0.35rem 1.35rem;
		font-size: 0.85rem;
	}

	.synergy-option:has(input:checked) textarea { display: block; }

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.notice {
		max-width: 52rem;
		padding: 0.7rem 0.9rem;
		border-radius: 0.5rem;
	}

	.error { background: color-mix(in srgb, var(--error) 15%, transparent); color: var(--error); }
	.success { background: color-mix(in srgb, var(--brand) 15%, transparent); }

	@media (max-width: 40rem) {
		.field-row,
		.tower-groups { grid-template-columns: 1fr; }
	}
</style>
