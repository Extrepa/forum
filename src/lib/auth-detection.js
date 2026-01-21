/**
 * Client-side authentication type detection
 * Checks for browser-based authentication APIs and existing session cookies
 */

export function detectAuthType() {
  if (typeof window === 'undefined') {
    // Server-side: default to 'none'
    return 'none';
  }

  // Check for browser-based authentication APIs
  const hasWebAuthn = typeof navigator !== 'undefined' && 
    (navigator.credentials || navigator.credentials?.get);
  
  const hasCredentialManagement = typeof navigator !== 'undefined' && 
    navigator.credentials && 
    typeof navigator.credentials.get === 'function';

  // Check for existing session cookie
  const hasSessionCookie = document.cookie
    .split(';')
    .some(cookie => cookie.trim().startsWith('errl_forum_session='));

  if (hasWebAuthn || hasCredentialManagement) {
    return 'browser';
  } else if (hasSessionCookie) {
    return 'cookie';
  } else {
    return 'none';
  }
}
