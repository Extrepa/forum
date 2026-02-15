'use client';

import { useRef, useEffect } from 'react';
import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function SearchResultsPopover({ results, query, onClose, onResultClick, excludeRef }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsidePopover = popoverRef.current && popoverRef.current.contains(event.target);
      const isInsideExclude = excludeRef && excludeRef.current && excludeRef.current.contains(event.target);
      
      if (!isInsidePopover && !isInsideExclude) {
        onClose();
      }
    };

    if (results && results.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [results, onClose, excludeRef]);

  const getTypeLabel = (type) => {
    const labels = {
      thread: 'General Post',
      announcement: 'Announcement',
      event: 'Event',
      music: 'Music',
      project: 'Project',
      reply: 'Reply',
      user: 'User',
      art: 'Art',
      bugs: 'Bug Report',
      rant: 'Rant',
      nostalgia: 'Nostalgia',
      lore: 'Lore',
      memories: 'Memories',
    };
    return labels[type] || type;
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const plainText = typeof text === 'string' 
      ? text.replace(/<[^>]*>/g, '').trim() 
      : String(text).trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="search-results-popover" ref={popoverRef}>
      <div className="search-results-header">
        <span className="search-results-count">
          {results.length} result{results.length === 1 ? '' : 's'} for &quot;{query}&quot;
        </span>
      </div>
      <div className="search-results-list">
        {results.slice(0, 5).map((result) => {
          const preferredColorRaw = result?.author_color_preference;
          const preferredColorIndex =
            preferredColorRaw === null || preferredColorRaw === undefined
              ? null
              : Number(preferredColorRaw);
          const colorIndex = getUsernameColorIndex(result.author_name, {
            preferredColorIndex: Number.isFinite(preferredColorIndex) ? preferredColorIndex : null,
          });

          return (
            <div
              key={`${result.type}-${result.id}`}
              className="search-result-item"
              onClick={() => {
                if (onResultClick) {
                  onResultClick(result.url);
                }
              }}
            >
              <div className="search-result-header">
                <h4 className="search-result-title">
                  {result.title || result.thread_title || 'Untitled'}
                </h4>
                <span className="search-result-type">
                  {getTypeLabel(result.type)}
                </span>
              </div>
              {(result.bodyHtml || result.detailsHtml || result.descriptionHtml || result.body) && (
                <div className="search-result-preview">
                  {truncateText(
                    result.bodyHtml || result.detailsHtml || result.descriptionHtml || result.body
                  )}
                </div>
              )}
              <div className="search-result-meta">
                <span
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <Username
                    name={result.author_name}
                    colorIndex={colorIndex}
                    preferredColorIndex={Number.isFinite(preferredColorIndex) ? preferredColorIndex : null}
                  />
                </span>
                <span className="search-result-date" suppressHydrationWarning>
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
        {results.length > 5 && (
          <div className="search-results-more">
            <a href={`/search?q=${encodeURIComponent(query)}`} className="search-results-link">
              View all {results.length} results →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
