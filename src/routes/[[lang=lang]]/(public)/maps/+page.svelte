<script lang="ts">
	import MapSelector from '$lib/components/public/MapSelector.svelte';
	import { m } from '$lib/paraglide/messages.js';
	let { data } = $props();
</script>

<svelte:head>
	<title>{m.maps_title()}</title>
	<meta name="description" content={m.maps_meta_description()} />
	<link rel="canonical" href={data.canonical} />
</svelte:head>

<MapSelector maps={data.maps} title={m.maps_heading()} lead={m.maps_lead()} />
