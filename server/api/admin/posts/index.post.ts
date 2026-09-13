export default defineEventHandler(async (event) => {
  const data = await validatedBody(event, postSchema)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await writeDatabase(() => database(event).prepare('INSERT INTO posts (id,title,slug,excerpt,content,category_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id, data.title, data.slug, data.excerpt, data.content, data.category_id, data.status, now, now).run())
  setResponseStatus(event, 201)
  return { id }
})
