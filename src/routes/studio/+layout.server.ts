import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	return {
		studioUser: locals.studioUser,
		isLogin: url.pathname === '/studio/login'
	};
};
