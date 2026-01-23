'use client';

import { useRouter } from 'next/navigation';

/**
 * CommentActions - Quote/Reply buttons for comments and replies
 * 
 * Layout:
 * Bottom Right: [Quote] [Reply] buttons
 */
export default function CommentActions({
  commentId,
  commentAuthor,
  commentBody,
  onQuote,
  onReply,
  replyHref,
  className = ''
}) {
  const router = useRouter();

  const handleQuote = () => {
    if (onQuote) {
      onQuote({ author: commentAuthor, body: commentBody });
    } else {
      // Default quote behavior - could open a quote modal or scroll to form
      const quoteText = `> @${commentAuthor} said:\n${commentBody.split('\n').slice(0, 8).map(l => `> ${l}`).join('\n')}\n\n`;
      // You could dispatch an event or use a context to populate a form
      console.log('Quote:', quoteText);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(commentId);
    } else if (replyHref) {
      router.push(replyHref);
    }
  };

  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'flex-end',
        marginTop: '8px'
      }}
    >
      <button
        type="button"
        onClick={handleQuote}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          border: '1px solid rgba(52, 225, 255, 0.3)',
          borderRadius: '4px',
          background: 'rgba(2, 7, 10, 0.4)',
          color: 'var(--muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'rgba(52, 225, 255, 0.6)';
          e.target.style.background = 'rgba(13, 51, 68, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = 'rgba(52, 225, 255, 0.3)';
          e.target.style.background = 'rgba(2, 7, 10, 0.4)';
        }}
      >
        Quote
      </button>
      <button
        type="button"
        onClick={handleReply}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          border: '1px solid rgba(52, 225, 255, 0.3)',
          borderRadius: '4px',
          background: 'rgba(2, 7, 10, 0.4)',
          color: 'var(--muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'rgba(52, 225, 255, 0.6)';
          e.target.style.background = 'rgba(13, 51, 68, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = 'rgba(52, 225, 255, 0.3)';
          e.target.style.background = 'rgba(2, 7, 10, 0.4)';
        }}
      >
        Reply
      </button>
    </div>
  );
}
