import { getEasterEgg, getForumStrings, isLoreEnabled } from '../lib/forum-texts';

export default function Loading() {
  const useLore = isLoreEnabled();
  const strings = getForumStrings({ useLore });
  const easterEgg = getEasterEgg({ useLore });

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Loading…</h2>
        <p className="muted">{strings.hero.subline}</p>
        {easterEgg ? <p className="muted">{easterEgg}</p> : null}
      </section>
    </div>
  );
}

