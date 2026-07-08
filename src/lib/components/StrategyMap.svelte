<script lang="ts">
	import type { PlacementRow } from '$lib/types/db';
	import type { TowerWithIcon } from '$lib/tower-icons';

	type Point = { x: number; y: number };
	type Props = {
		imageUrl: string | null;
		placements: PlacementRow[];
		towers: TowerWithIcon[];
		mode?: 'edit' | 'view';
		selectedId?: number | null;
		/** edit mode: whether a palette tower is armed, so map clicks place it */
		canPlace?: boolean;
		onadd?: (pos: Point) => void;
		onmove?: (id: number, pos: Point) => void;
		onselect?: (id: number | null) => void;
	};

	let {
		imageUrl,
		placements,
		towers,
		mode = 'view',
		selectedId = null,
		canPlace = false,
		onadd,
		onmove,
		onselect
	}: Props = $props();

	const towerById = $derived(new Map(towers.map((t) => [t.id, t])));

	let container: HTMLDivElement | undefined = $state();
	let drag: { id: number; startX: number; startY: number; pos: Point; moved: boolean } | null =
		$state(null);

	function clamp01(value: number): number {
		return Math.min(1, Math.max(0, value));
	}

	function toNormalized(event: PointerEvent | MouseEvent): Point {
		const rect = container!.getBoundingClientRect();
		return {
			x: clamp01((event.clientX - rect.left) / rect.width),
			y: clamp01((event.clientY - rect.top) / rect.height)
		};
	}

	function markerPos(placement: PlacementRow): Point {
		return drag?.id === placement.id ? drag.pos : { x: placement.pos_x, y: placement.pos_y };
	}

	function requireTower(towerId: number): TowerWithIcon {
		const tower = towerById.get(towerId);
		if (!tower) throw new Error(`Missing tower ${towerId}`);
		return tower;
	}

	function markerTitle(placement: PlacementRow): string {
		const tower = requireTower(placement.tower_id);
		const parts = [tower.name];
		if (placement.final_path) parts.push(placement.final_path);
		if (placement.label) parts.push(`“${placement.label}”`);
		return parts.join(' · ');
	}

	function onMapClick(event: MouseEvent) {
		if (mode !== 'edit') return;
		if (drag) return;
		if (canPlace && onadd) {
			onadd(toNormalized(event));
		} else {
			onselect?.(null);
		}
	}

	function onMarkerDown(event: PointerEvent, placement: PlacementRow) {
		if (mode !== 'edit') return;
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		drag = {
			id: placement.id,
			startX: event.clientX,
			startY: event.clientY,
			pos: { x: placement.pos_x, y: placement.pos_y },
			moved: false
		};
	}

	function onMarkerMove(event: PointerEvent) {
		if (!drag) return;
		const moved =
			drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4;
		drag = { ...drag, pos: toNormalized(event), moved };
	}

	function onMarkerUp(placement: PlacementRow) {
		if (!drag) return;
		if (drag.moved) {
			onmove?.(placement.id, drag.pos);
		} else {
			onselect?.(placement.id);
		}
		drag = null;
	}
</script>

<!-- Pointer-driven canvas; keyboard editing is out of scope for the internal tool. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class="map {mode}"
	class:placing={mode === 'edit' && canPlace}
	bind:this={container}
	onclick={onMapClick}
>
	{#if imageUrl}
		<img class="map-image" src={imageUrl} alt="Map" draggable="false" />
	{:else}
		<div class="no-image">No map image</div>
	{/if}

	{#each placements as placement (placement.id)}
		{@const tower = requireTower(placement.tower_id)}
		{@const pos = markerPos(placement)}
		<button
			type="button"
			class="marker cat-{tower.category.toLowerCase()}"
			class:selected={placement.id === selectedId}
			style="left: {pos.x * 100}%; top: {pos.y * 100}%;"
			title={markerTitle(placement)}
			aria-label={markerTitle(placement)}
			tabindex={mode === 'edit' ? 0 : -1}
			onclick={(e) => e.stopPropagation()}
			onpointerdown={(e) => onMarkerDown(e, placement)}
			onpointermove={onMarkerMove}
			onpointerup={() => onMarkerUp(placement)}
		>
			<img class="marker-icon" src={tower.icon_url} alt={tower.name} draggable="false" />
		</button>
	{/each}
</div>

<style>
	.map {
		position: relative;
		max-width: 40rem;
		user-select: none;
	}

	.map.placing {
		cursor: crosshair;
	}

	.map-image {
		display: block;
		width: 100%;
		border-radius: 0.5rem;
	}

	.no-image {
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		background: #f2f2f2;
		color: #888;
		border-radius: 0.5rem;
	}

	.marker {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 2rem;
		height: 2rem;
		padding: 0.15rem;
		border-radius: 999px;
		border: 2px solid rgba(0, 0, 0, 0.4);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
		touch-action: none;
		overflow: hidden;
	}

	.marker-icon {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 999px;
		object-fit: contain;
		pointer-events: none;
	}

	.map.edit .marker {
		cursor: grab;
	}

	.map.view .marker {
		cursor: default;
		pointer-events: auto;
	}

	.marker.selected {
		outline: 3px solid #111;
		outline-offset: 1px;
	}

	.cat-primary {
		background: #3b82f6;
	}

	.cat-military {
		background: #16a34a;
	}

	.cat-magic {
		background: #9333ea;
	}

	.cat-support {
		background: #d97706;
	}

	.cat-hero {
		background: #dc2626;
		border-color: #facc15;
	}
</style>
