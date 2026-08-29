import { json } from '@sveltejs/kit'
import { writeClient } from '$lib/sanity/server'
import type { ContactPayload } from '$lib/types'
import type { RequestHandler } from './$types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const POST: RequestHandler = async ({ request }) => {
  let body: Partial<ContactPayload & { website: string }>

  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  const website = String(body.website ?? '')

  // ханипот: если поле заполнено — скорее всего бот
  if (website) {
    return json({ ok: false, error: 'spam' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim().slice(0, 200)
  const email = String(body.email ?? '').trim().slice(0, 320)
  const message = String(body.message ?? '').trim().slice(0, 4000)

  if (!name || !email || !message) {
    return json({ ok: false, error: 'empty' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'email' }, { status: 400 })
  }

  try {
    await writeClient.create({
      _type: 'contactMessage',
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      read: false
    })

    return json({ ok: true })
  } catch (error) {
    console.error('Sanity create error:', error)

    return json({ ok: false, error: 'sanity' }, { status: 500 })
  }
}