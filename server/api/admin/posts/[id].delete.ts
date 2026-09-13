export default defineEventHandler(async (event) => {
  const result = await database(event).prepare('DELETE FROM posts WHERE id=?').bind(itemId(event)).run()
  if (!result.meta.changes) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  setResponseStatus(event, 204)
  return null
})
