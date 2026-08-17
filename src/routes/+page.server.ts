import { getAllPosts } from '$lib/utils/posts';

export async function load({ fetch }) {
  const posts = await getAllPosts();

  return {
    posts: posts.slice(0, 3),
  };
}
