export default defineEventHandler(async (event) => {
  const result = await database(event).prepare('DELETE FROM categories WHERE id=?').bind(itemId(event)).run()
  if (!result.meta.changes) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  setResponseStatus(event, 204)
  return null
})
