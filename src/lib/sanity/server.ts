import { createClient } from '@sanity/client'
import { SANITY_API_TOKEN } from '$env/static/private'
import { API_VERSION } from './client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string
const dataset = import.meta.env.VITE_SANITY_DATASET as string

export const writeClient = createClient({
	projectId,
	dataset,
	apiVersion: API_VERSION,
	token: SANITY_API_TOKEN,
	useCdn: false
})