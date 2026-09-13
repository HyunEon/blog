import type { D1Database } from '@cloudflare/workers-types'
import type { H3Event } from 'h3'

export function database(event: H3Event): D1Database {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  return db
}

export async function writeDatabase<T>(action: () => Promise<T>): Promise<T> {
  try { return await action() }
  catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('UNIQUE constraint')) throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
    if (message.includes('FOREIGN KEY constraint')) throw createError({ statusCode: 400, statusMessage: 'Category does not exist' })
    throw error
  }
}
