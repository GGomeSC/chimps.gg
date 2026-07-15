import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../.vercel/output/config.json', import.meta.url);
const config = JSON.parse(await readFile(configPath, 'utf8'));

if (!Array.isArray(config.routes)) {
	throw new Error('Vercel output config does not contain a routes array');
}

const studioRoutes = config.routes.filter(
	(route) => typeof route.src === 'string' && route.src.startsWith('^/studio')
);

if (studioRoutes.length === 0) {
	throw new Error('No generated Studio routes found in Vercel output config');
}

const remainingRoutes = config.routes.filter((route) => !studioRoutes.includes(route));
const firstPublicRoute = remainingRoutes.findIndex(
	(route) =>
		typeof route.dest === 'string' && route.dest.startsWith('/[[lang=lang]]/(public)')
);

if (firstPublicRoute === -1) {
	throw new Error('No generated public ISR routes found in Vercel output config');
}

config.routes = [
	...remainingRoutes.slice(0, firstPublicRoute),
	...studioRoutes,
	...remainingRoutes.slice(firstPublicRoute)
];

await writeFile(configPath, `${JSON.stringify(config, null, '\t')}\n`);
console.log(`Placed ${studioRoutes.length} Studio routes before public ISR routes`);
