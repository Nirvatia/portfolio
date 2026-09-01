import { createClient } from '@sanity/client';

export const API_VERSION = '2025-01-01';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const dataset = import.meta.env.VITE_SANITY_DATASET as string | undefined;

if (!projectId || !dataset) {
	throw new Error('Sanity: не заданы VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET — проверь .env');
}

export const sanityConfig = { projectId, dataset, apiVersion: API_VERSION };

export const client = createClient({ ...sanityConfig, useCdn: true });
