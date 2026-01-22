import { Suspense } from 'react';
import SearchClient from './SearchClient';
import SearchResults from './SearchResults';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getSessionUser } from '../../lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
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
