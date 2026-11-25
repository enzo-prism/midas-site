import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
// Every top-level .html file is a page (index, provider pages, 404). public/ files are copied as-is.
const pages = Object.fromEntries(readdirSync(root).filter(file => file.endsWith('.html')).map(file => [file.slice(0, -5), resolve(root, file)]));

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };
const plainText = (html: string) => html
  .replace(/<i\b[^>]*><\/i>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, name: string) => entities[name])
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Builds FAQPage structured data from the FAQ a page actually renders (`.faq-items details`), so the
 * markup can never drift from the visible questions and answers.
 */
export function faqSchema(html: string): string | null {
  const block = html.match(/<div class="faq-items"[^>]*>([\s\S]*?)<\/div>/);
  if (!block) return null;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) throw new Error('A page with an FAQ needs a canonical URL.');
  const questions = [...block[1].matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(([, question, answer]) => ({
    '@type': 'Question',
    name: plainText(question),
    acceptedAnswer: { '@type': 'Answer', text: plainText(answer) },
  }));
  if (!questions.length) return null;
  const data = { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${canonical}#faq`, url: canonical, mainEntity: questions };
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

/** `<!-- @include name -->` pulls in partials/name.html; FAQ pages get generated FAQPage JSON-LD. */
function pageTemplates(): Plugin {
  return {
    name: 'midas-page-templates',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let output = html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name: string) => readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8').trim());
        const faq = faqSchema(output);
        if (faq) output = output.replace('</head>', `  <script type="application/ld+json" id="faq-schema">\n${faq}\n  </script>\n</head>`);
        return output;
      },
    },
  };
}

/** Matches Vercel's `cleanUrls`: /claude serves claude.html in dev and preview too. */
function cleanUrls(): Plugin {
  const rewrite = (directories: string[]): Connect.NextHandleFunction => (request, _response, next) => {
    const [path, query = ''] = (request.url ?? '/').split('?');
    if (path !== '/' && !/\.[a-z0-9]+$/i.test(path) && !path.startsWith('/@') && !path.startsWith('/src/') && !path.startsWith('/node_modules/')) {
      const file = `${path.replace(/\/$/, '')}.html`;
      if (directories.some(directory => existsSync(resolve(directory, `.${file}`)))) request.url = `${file}${query ? `?${query}` : ''}`;
    }
    next();
  };
  return {
    name: 'midas-clean-urls',
    configureServer(server) { server.middlewares.use(rewrite([root, resolve(root, 'public')])); },
    configurePreviewServer(server) { server.middlewares.use(rewrite([resolve(root, 'dist')])); },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [pageTemplates(), cleanUrls()],
  build: { rollupOptions: { input: pages } },
});
