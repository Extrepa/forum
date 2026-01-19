'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchClient({ query: initialQuery, results }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      thread: 'General Post',
      announcement: 'Announcement',
      event: 'Event',
      music: 'Music',
      project: 'Project',
      reply: 'Reply'
    };
    return labels[type] || type;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    const plainText = typeof text === 'string' 
      ? text.replace(/<[^>]*>/g, '').trim() 
      : String(text).trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Search</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, threads, events, music, projects..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(52, 225, 255, 0.35)',
              background: 'rgba(2, 7, 10, 0.6)',
              color: 'var(--ink)',
              fontSize: '16px',
              fontFamily: 'inherit'
            }}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {initialQuery && (
        <section className="card">
          <h3 className="section-title">
            {results.length > 0 
              ? `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${initialQuery}"`
              : `No results found for "${initialQuery}"`
            }
          </h3>
          {results.length > 0 && (
            <div className="list">
              {results.map((result) => (
                <div key={`${result.type}-${result.id}`} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3>
                        <a href={result.url} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {result.title || result.thread_title || 'Untitled'}
                        </a>
                      </h3>
                      <span className="muted" style={{ fontSize: '14px' }}>
                        {getTypeLabel(result.type)}
                        {result.type === 'reply' && result.thread_title && ` in "${result.thread_title}"`}
                      </span>
                    </div>
                  </div>
                  {result.image_key && (
                    <img
                      src={`/api/media/${result.image_key}`}
                      alt=""
                      className="post-image"
                      loading="lazy"
                      style={{ maxHeight: '200px', width: 'auto', marginBottom: '8px' }}
                    />
                  )}
                  {(result.bodyHtml || result.detailsHtml || result.descriptionHtml) && (
                    <div
                      className="post-body"
                      style={{ marginBottom: '8px' }}
                      dangerouslySetInnerHTML={{ 
                        __html: result.bodyHtml || result.detailsHtml || result.descriptionHtml
                      }}
                    />
                  )}
                  {result.body && !result.bodyHtml && (
                    <p className="muted" style={{ marginBottom: '8px' }}>
                      {truncateText(result.body)}
                    </p>
                  )}
                  <div className="list-meta">
                    {result.author_name} · {new Date(result.created_at).toLocaleString()}
                    {result.reply_count !== undefined && ` · ${result.reply_count} ${result.reply_count === 1 ? 'reply' : 'replies'}`}
                    {result.status && (
                      <span className={`status-badge status-${result.status}`} style={{ marginLeft: '8px' }}>
                        {result.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
