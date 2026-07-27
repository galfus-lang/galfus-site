import matter from 'gray-matter';

export async function getAllPosts() {
  const mdModules = import.meta.glob('/src/lib/markdown/posts/*.md', {
    query: '?raw',
    import: 'default',
  });

  const posts = await Promise.all(
    Object.entries(mdModules).map(async ([path, resolver]) => {
      const rawContent = (await resolver()) as string;
      const { data } = matter(rawContent);

      const slug = path.split('/').pop()?.replace('.md', '');

      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        thumbnail: data.thumbnail,
      };
    }),
  );

  const now = new Date().getTime();

  // Filter out future posts and sort by date descending
  const publishedPosts = posts
    .filter((post) => new Date(post.date).getTime() <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return publishedPosts;
}
