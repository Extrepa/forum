import { NextResponse } from 'next/server';

export function middleware(request) {
  const requestId = request.headers.get('x-errl-request-id') || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-errl-request-id', requestId);
  requestHeaders.set('x-errl-edge', 'worker');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set('x-errl-request-id', requestId);
  response.headers.set('x-errl-edge', 'worker');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|easter-eggs|robots.txt|sitemap.xml).*)'
  ]
};
