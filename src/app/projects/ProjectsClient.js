'use client';

import { useRouter } from 'next/navigation';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function ProjectsClient({ projects, canCreate, notice }) {
  const router = useRouter();
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const navigateToProject = (event, href) => {
    if (event?.target?.closest && event.target.closest('a')) {
      return;
    }
    router.push(href);
  };

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">{strings.cards.projects.title}</h2>
        <p className="muted">{strings.cards.projects.description}</p>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {projects.length === 0 ? (
            <p className="muted">{strings.cards.projects.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = projects[0];
              const rest = projects.slice(1);

              const renderItem = (row, { condensed }) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;
                const href = `/projects/${row.id}`;

                return (
                  <a
                    key={row.id}
                    href={href}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                    onClick={(e) => {
                      // Allow nested links (GitHub, Demo) to work
                      if (e.target.closest('a.project-link')) {
                        e.stopPropagation();
                        return;
                      }
                    }}
                  >
                    <div className="post-header" style={{ marginBottom: condensed ? '4px' : '6px' }}>
                      <h3 style={{ marginBottom: 0 }}>{row.title}</h3>
                      <span className={`status-badge status-${row.status}`}>{row.status}</span>
                    </div>
                    {!condensed && row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    {!condensed ? <div className="post-body" dangerouslySetInnerHTML={{ __html: row.descriptionHtml }} /> : null}
                    {!condensed ? (
                      <div className="project-links">
                        {row.github_url ? (
                          <a href={row.github_url} target="_blank" rel="noopener noreferrer" className="project-link" onClick={(e) => e.stopPropagation()}>
                            GitHub
                          </a>
                        ) : null}
                        {row.demo_url ? (
                          <a href={row.demo_url} target="_blank" rel="noopener noreferrer" className="project-link" onClick={(e) => e.stopPropagation()}>
                            Demo
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                    <div
                      className="list-meta"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        marginTop: '4px'
                      }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>
                        {new Date(row.created_at).toLocaleString()}
                        {row.reply_count > 0
                          ? ` · ${row.reply_count} ${row.reply_count === 1 ? 'reply' : 'replies'}`
                          : ''}
                      </span>
                    </div>
                  </a>
                );
              };

              return (
                <>
                  {renderItem(latest, { condensed: false })}
                  {rest.length ? (
                    <>
                      <div className="list-divider" />
                      <h3 className="section-title" style={{ marginTop: 0 }}>More</h3>
                      {rest.map((row) => renderItem(row, { condensed: true }))}
                    </>
                  ) : null}
                </>
              );
            })()
          )}
        </div>
      </section>
    </div>
  );
}
