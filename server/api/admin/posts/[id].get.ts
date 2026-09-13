import type { Post } from '../../../../shared/types'
export default defineEventHandler(async (event) => {
  const post = await database(event).prepare(`SELECT ${postColumns},p.content ${postJoin} WHERE p.id = ?`).bind(itemId(event)).first<Post>()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
})
