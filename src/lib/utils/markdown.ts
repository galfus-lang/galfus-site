import { marked } from 'marked';
import matter from 'gray-matter';
import { createHighlighter, type HighlighterCore } from 'shiki';

let highlighter: HighlighterCore | null = null;

async function initHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['vitesse-dark'],
      langs: ['javascript', 'typescript', 'rust', 'svelte', 'bash', 'json', 'html', 'css'],
    });
  }
  return highlighter;
}

// Custom YouTube embed extension
const youtubeExtension = {
  name: 'youtube',
  level: 'block',
  start(src: string) {
    return src.match(/\[youtube\s+id="([^"]+)"\]/)?.index;
  },
  tokenizer(src: string, tokens: any[]) {
    const rule = /^\[youtube\s+id="([^"]+)"\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'youtube',
        raw: match[0],
        videoId: match[1],
      };
    }
  },
  renderer(token: any) {
    return `
      <div class="my-8 aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-primary-5 bg-neutral-2">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${token.videoId}"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  },
};

marked.use({ extensions: [youtubeExtension as any] });

export async function parseMarkdown(rawContent: string) {
  const { data, content } = matter(rawContent);
  const hl = await initHighlighter();

  // Extract Headings for TOC
  const toc: { id: string; text: string; level: number }[] = [];

  const renderer = {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang || 'text';
      try {
        return hl.codeToHtml(text.trim(), { lang: language, theme: 'vitesse-dark' });
      } catch (e) {
        return `<pre><code class="language-${language}">${text}</code></pre>`;
      }
    },
    heading({ text, depth, tokens }: { text: string; depth: number; tokens: any[] }) {
      // Generate a simple slug
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      if (depth === 2 || depth === 3) {
        toc.push({ id, text, level: depth });
      }
      return `<h${depth} id="${id}" class="group relative font-bold text-primary-12 mt-10 mb-4 tracking-tight ${depth === 2 ? 'text-3xl' : 'text-2xl'}">
        ${text}
        <a href="#${id}" class="absolute -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary-8 hidden md:block" aria-hidden="true">#</a>
      </h${depth}>`;
    },
    paragraph(this: any, token: any) {
      const text = this.parser.parseInline(token.tokens);
      return `<p class="mb-6 leading-relaxed text-primary-12/90 text-lg">${text}</p>`;
    },
    list(this: any, token: any) {
      const type = token.ordered ? 'ol' : 'ul';
      const className = token.ordered ? 'list-decimal' : 'list-disc';
      const body = token.items
        .map((item: any) => {
          let itemBody = '';
          if (item.task) {
            const checkbox = `<input ${item.checked ? 'checked="" ' : ''}disabled="" type="checkbox"> `;
            itemBody += checkbox;
          }
          itemBody += this.parser.parse(item.tokens, !!item.loose);
          return `<li>${itemBody}</li>\n`;
        })
        .join('');
      return `<${type} class="${className} ml-6 mb-6 space-y-2 text-primary-12/90 text-lg">\n${body}</${type}>\n`;
    },
    blockquote(this: any, token: any) {
      const text = this.parser.parse(token.tokens);
      return `<blockquote class="border-l-4 border-primary-8 pl-6 italic text-primary-11 my-8 text-lg bg-primary-2/50 py-3 pr-4 rounded-r-lg">${text}</blockquote>`;
    },
  };

  marked.use({ renderer: renderer as any });

  const html = await marked.parse(content, { async: true });

  return {
    metadata: data,
    html,
    toc,
  };
}
