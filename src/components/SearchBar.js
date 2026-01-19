'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="header-search-container" ref={formRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="header-search-toggle"
      >
        Search
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="header-search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="header-search-input"
            autoFocus
          />
          <button type="submit" className="header-search-button">
            Search
          </button>
        </form>
      )}
    </div>
  );
}