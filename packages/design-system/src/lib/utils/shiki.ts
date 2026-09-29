import { createHighlighter, type HighlighterCore, type LanguageRegistration } from 'shiki';
import galfusGrammar from './galfus.tmLanguage.json';
import { createCssVariablesTheme } from 'shiki';

let highlighter: HighlighterCore | null = null;

const galfusRegistration: LanguageRegistration = {
  ...(galfusGrammar as any),
  name: 'galfus',
  aliases: ['gfs'],
};

export const shikiTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [shikiTheme],
      langs: [
        'javascript',
        'typescript',
        'rust',
        'svelte',
        'bash',
        'json',
        'html',
        'css',
        galfusRegistration,
      ],
    });
  }
  return highlighter;
}
