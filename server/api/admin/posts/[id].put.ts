export default defineEventHandler(async (event) => {
  const id = itemId(event)
  const data = await validatedBody(event, postSchema)
  const result = await writeDatabase(() => database(event).prepare('UPDATE posts SET title=?,slug=?,excerpt=?,content=?,category_id=?,status=?,updated_at=? WHERE id=?').bind(data.title, data.slug, data.excerpt, data.content, data.category_id, data.status, new Date().toISOString(), id).run())
  if (!result.meta.changes) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return { id }
})
