import { getEasterEgg, getForumStrings, isLoreEnabled } from '../lib/forum-texts';

export default function NotFound() {
  const useLore = isLoreEnabled();
  const strings = getForumStrings({ useLore });
  const easterEgg = getEasterEgg({ useLore });

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Not found</h2>
        <p className="muted">{strings.search.noResults}</p>
        {easterEgg ? <p className="muted">{easterEgg}</p> : null}
        <p>
          <a href="/" style={{ color: 'var(--errl-accent-3)', textDecoration: 'none' }}>
            Back to the portal
          </a>
        </p>
      </section>
    </div>
  );
}

