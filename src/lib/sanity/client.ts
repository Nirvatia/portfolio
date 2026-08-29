import { createClient } from '@sanity/client'

export const API_VERSION = '2025-01-01'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string
const dataset = import.meta.env.VITE_SANITY_DATASET as string

export const client = createClient({
	projectId,
	dataset,
	apiVersion: API_VERSION,
	useCdn: true
})