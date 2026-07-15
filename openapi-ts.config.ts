import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: { path: './go/openapi.yaml' },
	output: {
		path: 'src/lib/server/generated/chimps'
	},
	plugins: [
		{ name: '@hey-api/client-fetch', throwOnError: true },
		{ name: '@hey-api/typescript' },
		{ name: '@hey-api/sdk' }
	]
});
