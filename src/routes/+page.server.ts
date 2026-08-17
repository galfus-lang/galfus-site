import { getAllPosts } from '$lib/utils/posts';

export async function load({ fetch }) {
  const posts = await getAllPosts();

  let latestVersion: string | null = null;
  try {
    const res = await fetch('https://storage.galfus.com/manifest.json');
    if (res.ok) {
      const data = await res.json();
      latestVersion = `v${data.tags[data.latest_tag]}`;
      if (data.latest_tag !== 'stable') {
        latestVersion += '-' + data.latest_tag;
      }
    }
  } catch (e) {
    console.error('Failed to fetch latest version', e);
  }

  // Return only top 3
  return {
    posts: posts.slice(0, 3),
    latestVersion
  };
}
