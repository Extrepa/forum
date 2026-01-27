import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const renderer = new marked.Renderer();

// Custom extension for @mentions
const mentionExtension = {
  name: 'mention',
  level: 'inline',
  start(src) { return src.indexOf('@'); },
  tokenizer(src, tokens) {
    // Match @username, but ensure it's either at start of string or preceded by whitespace
    // Since tokenizer receives the remaining string, we check the start of src.
    // However, to ensure it's preceded by whitespace in the original text, 
    // we can check tokens[tokens.length-1] if it's a text token ending in whitespace.
    // A simpler way for marked inline extensions is to use the 'start' method correctly.
    const rule = /^@([a-z0-9_]{3,20})\b/i;
    const match = rule.exec(src);
    if (match) {
      // Check if preceded by whitespace or start of line
      const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      if (prevToken && prevToken.type === 'text' && !/\s$/.test(prevToken.raw)) {
        return; // Not preceded by whitespace
      }
      return {
        type: 'mention',
        raw: match[0],
        username: match[1]
      };
    }
  },
  renderer(token) {
    return `<a href="/profile/${token.username.toLowerCase()}">@${token.username}</a>`;
  }
};

marked.use({ extensions: [mentionExtension] });

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
      a: (tagName, attribs) => {
        // Only add target="_blank" to external links
        const isInternal = attribs.href && (attribs.href.startsWith('/') || attribs.href.startsWith('#'));
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            ...(isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' })
          }
        };
      }
    }
  });
}
