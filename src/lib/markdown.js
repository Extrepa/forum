import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const renderer = new marked.Renderer();

export function renderMarkdown(input) {
  const raw = marked.parse(String(input || ''), { renderer, breaks: true });
  return sanitizeHtml(raw, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'a'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer'
      })
    }
  });
}
