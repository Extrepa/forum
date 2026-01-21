'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Pagination({ currentPage, totalPages, baseUrl }) {
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  // Preserve quote parameters when navigating pages
  const buildUrl = (page) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    // Preserve quote params if they exist
    const quotes = searchParams.getAll('quote');
    quotes.forEach(q => params.append('quote', q));
    return `${baseUrl}?${params.toString()}`;
  };

  const pages = [];
  const maxVisible = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)} className="button" style={{ fontSize: '14px', padding: '6px 12px' }}>
          ← Previous
        </Link>
      ) : (
        <span className="button" style={{ fontSize: '14px', padding: '6px 12px', opacity: 0.5, cursor: 'not-allowed' }}>
          ← Previous
        </span>
      )}

      {startPage > 1 && (
        <>
          <Link href={buildUrl(1)} className="button" style={{ fontSize: '14px', padding: '6px 12px' }}>
            1
          </Link>
          {startPage > 2 && <span style={{ padding: '0 4px' }}>...</span>}
        </>
      )}

      {pages.map(page => (
        <Link
          key={page}
          href={buildUrl(page)}
          className={page === currentPage ? 'button active' : 'button'}
          style={{ 
            fontSize: '14px', 
            padding: '6px 12px',
            ...(page === currentPage ? { fontWeight: 'bold', opacity: 1 } : {})
          }}
        >
          {page}
        </Link>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ padding: '0 4px' }}>...</span>}
          <Link href={buildUrl(totalPages)} className="button" style={{ fontSize: '14px', padding: '6px 12px' }}>
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages ? (
        <Link href={buildUrl(currentPage + 1)} className="button" style={{ fontSize: '14px', padding: '6px 12px' }}>
          Next →
        </Link>
      ) : (
        <span className="button" style={{ fontSize: '14px', padding: '6px 12px', opacity: 0.5, cursor: 'not-allowed' }}>
          Next →
        </span>
      )}
    </div>
  );
}
