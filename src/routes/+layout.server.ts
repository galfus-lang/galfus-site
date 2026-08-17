import { getAllPosts } from '$lib/utils/posts';

export async function load({ fetch }) {
  let latestVersion: string | null = null;
  let latestTag: string | null = null;
  let fullLatestVersion: string | null = null;
  try {
    const res = await fetch('https://storage.galfus.com/manifest.json');
    if (res.ok) {
      const data = await res.json();
      latestVersion = data.tags[data.latest_tag];
      latestTag = data.latest_tag;
      if (latestTag !== 'stable') {
        fullLatestVersion = `v${latestVersion}-${latestTag}`;
      } else {
        fullLatestVersion = `v${latestVersion}`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch latest version', e);
  }

  return {
    latestVersion,
    latestTag,
    fullLatestVersion,
  };
}
