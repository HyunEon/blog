import type { H3Event } from 'h3'
import type { PostSummary } from '../../shared/types'

export const postColumns = 'p.id,p.title,p.slug,p.excerpt,p.category_id,p.status,p.created_at,p.updated_at,c.name AS category_name,c.slug AS category_slug'
export const postJoin = 'FROM posts p LEFT JOIN categories c ON c.id = p.category_id'

export async function listPosts(event: H3Event, admin = false) {
  const page = pageNumber(event)
  const category = getQuery(event).category
  if (category !== undefined && (typeof category !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) || category.length > 120)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid category' })
  }
  const filters = admin ? [] : ["p.status = 'published'"]
  const params: (string | number)[] = []
  if (category) { filters.push('c.slug = ?'); params.push(category as string) }
  const result = await database(event).prepare(`SELECT ${postColumns} ${postJoin} ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY p.created_at DESC, p.id DESC LIMIT 21 OFFSET ?`).bind(...params, (page - 1) * 20).all<PostSummary>()
  return { posts: result.results.slice(0, 20), page, hasMore: result.results.length > 20 }
}
