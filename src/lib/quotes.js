/**
 * Generate markdown quote block from author and body
 */
export function quoteMarkdown({ author, body }) {
  const safeAuthor = String(author || 'Someone').trim() || 'Someone';
  const text = String(body || '').trim();
  if (!text) return `> @${safeAuthor} said:\n>\n\n`;
  const lines = text.split('\n').slice(0, 8); // keep it short by default
  const quoted = lines.map((l) => `> ${l}`).join('\n');
  return `> @${safeAuthor} said:\n${quoted}\n\n`;
}

/**
 * Combine multiple quotes into a single markdown block
 */
export function combineQuotes(quotes) {
  return quotes.map(q => quoteMarkdown(q)).join('');
}
