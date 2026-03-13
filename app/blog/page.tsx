import { getAllPosts } from "@/lib/blog/content"
import { BlogIndex } from "@/components/blog/blog-index"

export default function BlogPage() {
  const posts = getAllPosts()
  return <BlogIndex posts={posts} />
}
