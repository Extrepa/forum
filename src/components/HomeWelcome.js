'use client';

import { useEffect, useState } from 'react';
import { getForumStrings, getTimeBasedGreetingTemplate, renderTemplateParts } from '../lib/forum-texts';
import Username from './Username';
import { useUiPrefs } from './UiPrefsProvider';
import { getUsernameColorIndex } from '../lib/usernameColor';

export default function HomeWelcome({ user, context = 'home' }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!user) {
    return (
      <section className="card" style={{ padding: '16px 20px' }}>
        <h2 className="section-title" style={{ marginBottom: '0' }}>{strings.hero.title}</h2>
      </section>
    );
  }

  const { template } = getTimeBasedGreetingTemplate({ date: mounted ? new Date() : new Date(0), useLore: loreEnabled, context });
  const parts = renderTemplateParts(template, 'username');

  return (
    <section className="card" style={{ padding: '16px 20px' }}>
      <h2 className="section-title" style={{ marginBottom: '0' }}>
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
