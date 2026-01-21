import { getSessionUser } from '../lib/auth';
import { getEasterEgg, getForumStrings } from '../lib/forum-texts';

export default async function NotFound() {
  const user = await getSessionUser();
  const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
  const useLore = !!user?.ui_lore_enabled || envLore;
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

