export interface Category { id: string; name: string; slug: string }
export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category_id: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  category_name: string | null
  category_slug: string | null
}
export type PostSummary = Omit<Post, 'content'>
export interface PostList { posts: PostSummary[]; page: number; hasMore: boolean }
