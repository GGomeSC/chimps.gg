<script lang="ts">
	import LatestGuidesRail from '$lib/components/public/LatestGuidesRail.svelte';
	import MapSelector from '$lib/components/public/MapSelector.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Bloons TD 6 strategy guides · chimps.gg</title>
	<meta name="description" content="Choose a Bloons TD 6 map and open a verified, versioned strategy guide for your next run." />
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content="Bloons TD 6 strategy guides · chimps.gg" />
	<meta property="og:description" content="Choose your map and get straight to a verified strategy." />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<MapSelector maps={data.maps} guideCount={data.readyCount} />
<LatestGuidesRail strategies={data.strategies} />
