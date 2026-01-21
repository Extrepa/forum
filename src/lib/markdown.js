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
      'mark',
      'span',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'blockquote',
      'pre',
      'code',
      'hr',
      'a'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class']
    },
    allowedClasses: {
      span: ['text-pink', 'text-blue', 'text-green', 'text-muted']
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer'
      })
    }
  });
}
