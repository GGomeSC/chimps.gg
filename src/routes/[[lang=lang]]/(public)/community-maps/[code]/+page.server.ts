import { error } from '@sveltejs/kit';
import { createPublicApi, chimpsErrorCode } from '$lib/server/chimps-client';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad=async({params,fetch,url})=>{try{return{map:await createPublicApi(fetch,url.origin).getCommunityMap(params.code.toUpperCase())}}catch(cause){if(chimpsErrorCode(cause)==='invalid_map_code')error(400,'Invalid map code');if(chimpsErrorCode(cause)==='map_not_found')error(404,'Community map not found');error(502,'Community map unavailable')}};
