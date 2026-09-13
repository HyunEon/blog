export default defineEventHandler(async (event) => {
  const id = itemId(event)
  const data = await validatedBody(event, categorySchema)
  const result = await writeDatabase(() => database(event).prepare('UPDATE categories SET name=?,slug=? WHERE id=?').bind(data.name, data.slug, id).run())
  if (!result.meta.changes) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  return { id }
})
