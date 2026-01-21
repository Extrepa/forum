'use client';

import { getForumStrings, getTimeBasedGreetingTemplate, renderTemplateParts } from '../lib/forum-texts';
import Username from './Username';
import { useUiPrefs } from './UiPrefsProvider';

export default function HomeWelcome({ user }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });
  
  if (!user) {
    return (
      <section className="card">
        <h2 className="section-title">{strings.hero.title}</h2>
        <p className="muted">{strings.hero.subline}</p>
      </section>
    );
  }

  const { template } = getTimeBasedGreetingTemplate({ date: new Date(), useLore: loreEnabled });
  const parts = renderTemplateParts(template, 'username');

  return (
    <section className="card">
      <h2 className="section-title">
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
      <p className="muted">{strings.hero.subline}</p>
    </section>
  );
}
