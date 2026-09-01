import { createClient } from '@sanity/client';
import { SANITY_API_TOKEN } from '$env/static/private';
import { sanityConfig } from './client';

if (!SANITY_API_TOKEN) {
	throw new Error(
		'Sanity: не задан SANITY_API_TOKEN — добавь его в .env (локально) и в env Vercel'
	);
}

export const writeClient = createClient({
	...sanityConfig,
	token: SANITY_API_TOKEN,
	useCdn: false
});
