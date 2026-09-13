import { z } from 'zod'
import type { H3Event } from 'h3'

const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const categorySchema = z.object({ name: z.string().trim().min(1).max(60), slug }).strict()
export const postSchema = z.object({
  title: z.string().trim().min(1).max(200), slug,
  excerpt: z.string().trim().max(500).default(''),
  content: z.string().trim().min(1).max(100000),
  category_id: z.string().uuid().nullable().default(null),
  status: z.enum(['draft', 'published']).default('draft'),
}).strict()

export async function validatedBody<T>(event: H3Event, schema: z.ZodType<T>): Promise<T> {
  const raw = await readRawBody(event)
  if (!raw || new TextEncoder().encode(raw).length > 512000) throw createError({ statusCode: 413, statusMessage: 'Body missing or too large' })
  let value: unknown
  try { value = JSON.parse(raw) }
  catch { throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' }) }
  const result = schema.safeParse(value)
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input', data: result.error.flatten() })
  return result.data
}

export function itemId(event: H3Event) {
  const value = getRouterParam(event, 'id')
  if (!z.string().uuid().safeParse(value).success) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  return value!
}

export function pageNumber(event: H3Event) {
  const value = getQuery(event).page ?? '1'
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)) throw createError({ statusCode: 400, statusMessage: 'Invalid page' })
  return Number(value)
}
