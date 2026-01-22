'use client';

import { getForumStrings, getTimeBasedGreetingTemplate, renderTemplateParts } from '../lib/forum-texts';
import Username from './Username';
import { useUiPrefs } from './UiPrefsProvider';

export default function HomeWelcome({ user }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });
  
  if (!user) {
    return (
      <section className="card" style={{ padding: '16px 20px' }}>
        <h2 className="section-title" style={{ marginBottom: '0' }}>{strings.hero.title}</h2>
      </section>
    );
  }

  const { template } = getTimeBasedGreetingTemplate({ date: new Date(), useLore: loreEnabled });
  const parts = renderTemplateParts(template, 'username');

  return (
    <section className="card" style={{ padding: '16px 20px' }}>
      <h2 className="section-title" style={{ marginBottom: '0' }}>
        {parts.hasVar ? (
          <>
            {parts.before}
            {user?.username ? <Username name={user.username} force="purple" /> : 'friend'}
            {parts.after}
          </>
        ) : (
          parts.before
        )}
      </h2>
    </section>
  );
}
