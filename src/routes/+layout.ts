import { error } from '@sveltejs/kit'
import { client } from '$lib/sanity/client'
import { PROFILE_QUERY, PROJECTS_QUERY } from '$lib/sanity/queries'
import type { Profile, Project } from '$lib/types'
import type { LayoutLoad } from './$types'

export const ssr = true
export const prerender = false

export const load: LayoutLoad = async () => {
	try {
		const [profile, projects] = await Promise.all([
			client.fetch<Profile | null>(PROFILE_QUERY),
			client.fetch<Project[]>(PROJECTS_QUERY)
		])
		if (!profile) throw error(404, 'Профиль не найден')
		return { profile, projects }
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e
		throw error(500, 'Не удалось загрузить интервью')
	}
}