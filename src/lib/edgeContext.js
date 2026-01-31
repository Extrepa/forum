import { headers, cookies } from 'next/headers';

export async function getEdgeContext() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  return {
    requestId: headerStore.get('x-errl-request-id') || null,
    edge: headerStore.get('x-errl-edge') || null,
    sessionToken: cookieStore.get('errl_forum_session')?.value || null
  };
}
