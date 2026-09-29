import { marked } from 'marked';
import matter from 'gray-matter';

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
  // We no longer need a renderer here, Svelte will render it
};

marked.use({ extensions: [youtubeExtension as any] });

export async function parseMarkdown(rawContent: string) {
  const { data, content } = matter(rawContent);

  // Lex the markdown into an AST (tokens array)
  const tokens = marked.lexer(content);

  // Extract Headings for TOC
  const toc: { id: string; text: string; level: number }[] = [];

  marked.walkTokens(tokens, (token) => {
    if (token.type === 'heading') {
      const id = token.text.toLowerCase().replace(/[^\w]+/g, '-');
      // Mutate token to inject ID for the client renderer
      (token as any).id = id;

      if (token.depth === 2 || token.depth === 3) {
        toc.push({ id, text: token.text, level: token.depth });
      }
    }
  });

  return {
    metadata: data,
    tokens,
    toc,
  };
}
