import { getAllPosts } from '$lib/utils/posts';

export async function load() {
  const posts = await getAllPosts();

  // Return only top 3
  return {
    posts: posts.slice(0, 3)
  };
}
