import type { Category } from '../../shared/types'
export default defineCachedEventHandler(async (event) => {
  return (await database(event).prepare('SELECT id,name,slug FROM categories ORDER BY name LIMIT 100').all<Category>()).results
}, { maxAge: 60, swr: false })
