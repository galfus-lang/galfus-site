import { error } from '@sveltejs/kit';
import { parseMarkdown } from '$lib/utils/markdown';

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
      toc
    };
  } catch (e) {
    console.error(e)
    throw error(404, 'Post not found');
  }
}

export function entries() {
  // We need to tell SvelteKit which slugs to prerender
  // In a real scenario with adapter-static, we list all possible slugs here.
  // For simplicity, we can load all files and return their slugs, or SvelteKit 
  // will automatically crawl links from the blog index page.
  // Given we crawl the blog index, SvelteKit can often discover them automatically.
  return [];
}
