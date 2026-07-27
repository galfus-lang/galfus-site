import { parseMarkdown } from '$lib/utils/markdown';
import { getAllPosts } from '$lib/utils/posts';
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { slug: string } }) {
  const { slug } = params;

  try {
    // Dynamically import the markdown file
    const rawContent = await import(`../../../lib/markdown/posts/${slug}.md?raw`);

    // Parse it using our utility
    const { html, metadata, toc } = await parseMarkdown(rawContent.default);

    return {
      slug,
      html,
      metadata,
      toc,
    };
  } catch (e) {
    console.error(e);
    throw error(404, 'Post not found');
  }
}

export async function entries() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug ?? '' }));
}
