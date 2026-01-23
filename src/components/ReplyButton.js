'use client';

/**
 * ReplyButton - Client-side Reply button that updates the form dynamically
 */
export default function ReplyButton({ replyId, replyAuthor, replyBody, replyHref, className = '' }) {

  const handleReply = (e) => {
    e.preventDefault();
    
    // Update URL without navigation
    if (replyHref) {
      const url = new URL(replyHref, window.location.origin);
      // Update the URL with the replyTo parameter
      const newUrl = `${url.pathname}?replyTo=${encodeURIComponent(replyId)}${url.hash || '#reply-form'}`;
      
      // Update URL without full page reload
      window.history.pushState({}, '', newUrl);
      
      // Dispatch custom event to update the form
      window.dispatchEvent(new CustomEvent('replyToChanged', {
        detail: {
          replyId,
          replyAuthor,
          replyBody,
          replyHref: newUrl
        }
      }));
      
      // Scroll to form
      const formElement = document.getElementById('reply-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  return (
    <a
      href={replyHref}
      className={className || 'post-link'}
      onClick={handleReply}
      style={{
        padding: '4px 10px',
        fontSize: '12px',
        border: '1px solid rgba(52, 225, 255, 0.3)',
        borderRadius: '4px',
        background: 'rgba(2, 7, 10, 0.4)',
        color: 'var(--muted)',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-block'
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
    </a>
  );
}
