<script lang="ts">
	import LatestGuidesRail from '$lib/components/public/LatestGuidesRail.svelte';
	import MapSelector from '$lib/components/public/MapSelector.svelte';
	import HomeHero from '$lib/components/public/HomeHero.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>{m.home_title()}</title>
	<meta name="description" content={m.home_meta_description()} />
	<link rel="canonical" href={data.canonical} />
	<meta property="og:title" content={m.home_og_title()} />
	<meta property="og:description" content={m.home_og_description()} />
	<meta property="og:url" content={data.canonical} />
</svelte:head>

<HomeHero guideCount={data.guideCount} mapCount={data.mapCount} />
<MapSelector maps={data.maps} />
<LatestGuidesRail strategies={data.strategies} />
