'use client';

import Username from './Username';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeWelcome({ user, greetingParts, fallbackText = 'Welcome' }) {
  if (!user) {
    // Use server-computed fallback text to avoid hydration mismatch
    return (
      <section className="card" style={{ padding: '16px 20px' }}>
        <h2 className="section-title" style={{ marginBottom: '0' }} suppressHydrationWarning>{fallbackText}</h2>
      </section>
    );
  }

  // Use server-computed greeting parts to avoid hydration mismatch
  const parts = greetingParts || { hasVar: false, before: fallbackText, after: '' };

  return (
    <section className="card" style={{ padding: '16px 20px' }}>
      <h2 className="section-title" style={{ marginBottom: '0' }} suppressHydrationWarning>
        {parts.hasVar ? (
          <>
            {parts.before}
            {user?.username ? (
              <Username 
                name={user.username} 
                colorIndex={getUsernameColorIndex(user.username, { preferredColorIndex: user.preferred_username_color_index })} 
              />
            ) : 'friend'}
            {parts.after}
          </>
        ) : (
          parts.before
        )}
      </h2>
    </section>
  );
}
