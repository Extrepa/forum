import { Suspense } from 'react';
import SearchClient from './SearchClient';
import SearchResults from './SearchResults';

export const dynamic = 'force-dynamic';

export default function SearchPage({ searchParams }) {
  const query = searchParams?.q || '';

  return (
    <Suspense fallback={<SearchClient query="" results={[]} />}>
      <SearchResults query={query} />
    </Suspense>
  );
}
