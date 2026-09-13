export default defineEventHandler(async (event) => {
  const data = await validatedBody(event, categorySchema)
  const id = crypto.randomUUID()
  const result = await writeDatabase(() => database(event).prepare('INSERT INTO categories (id,name,slug) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM categories) < 100').bind(id, data.name, data.slug).run())
  if (!result.meta.changes) throw createError({ statusCode: 409, statusMessage: 'Category limit reached' })
  setResponseStatus(event, 201)
  return { id }
})
