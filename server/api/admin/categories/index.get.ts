import type { Category } from '../../../../shared/types'
export default defineEventHandler(async (event) => (await database(event).prepare('SELECT id,name,slug FROM categories ORDER BY name LIMIT 100').all<Category>()).results)
