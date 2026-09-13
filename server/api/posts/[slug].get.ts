import type { Post } from '../../../shared/types'
export default defineCachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  const post = await database(event).prepare(`SELECT ${postColumns},p.content ${postJoin} WHERE p.slug = ? AND p.status = 'published'`).bind(slug).first<Post>()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
}, { maxAge: 60, swr: false })
