import { cookies } from 'next/headers';

const COOKIE_NAME = 'errl_forum_session';

export function getSessionToken() {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

export function setSessionCookie(response, token) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
}
