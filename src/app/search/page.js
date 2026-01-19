import { Suspense } from 'react';
import SearchClient from './SearchClient';
import SearchResults from './SearchResults';
import Breadcrumbs from '../../components/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default function SearchPage({ searchParams }) {
  const query = searchParams?.q || '';

  return (
    <>
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/search', label: 'Search' },
        ]}
      />
      <Suspense fallback={<SearchClient query="" results={[]} />}>
        <SearchResults query={query} />
      </Suspense>
    </>
  );
}
