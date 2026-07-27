import { getAllPosts } from '$lib/utils/posts';

export const prerender = true;

export async function GET() {
  const posts = await getAllPosts();
  
  const siteUrl = 'https://galfus.com';
  
  const staticPages = [
    '',
    '/blog',
    '/repl'
  ];

  const xml = `
    <?xml version="1.0" encoding="UTF-8" ?>
    <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages.map(page => `
        <url>
          <loc>${siteUrl}${page}</loc>
          <changefreq>weekly</changefreq>
          <priority>${page === '' ? '1.0' : '0.8'}</priority>
        </url>
      `).join('')}
      ${posts.map(post => `
        <url>
          <loc>${siteUrl}/blog/${post.slug}</loc>
          <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>
  `.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=0, s-maxage=3600'
    }
  });
}
