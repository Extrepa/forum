import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ForumThreadPage({ params }) {
  redirect(`/lobby/${params.id}`);
}
