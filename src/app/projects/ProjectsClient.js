'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import PostMetaBar from '../../components/PostMetaBar';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.projects.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.projects.description}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {projects.length === 0 ? (
            <p className="muted">{strings.cards.projects.empty}</p>
          ) : (
            (() => {
              // Build preferences map and assign unique colors
              const allUsernames = projects.map(p => p.author_name).filter(Boolean);
              const preferredColors = new Map();
              projects.forEach(p => {
                if (p.author_name && p.author_color_preference !== null && p.author_color_preference !== undefined) {
                  preferredColors.set(p.author_name, Number(p.author_color_preference));
                }
              });
              const usernameColorMap = assignUniqueColorsForPage(allUsernames, preferredColors);

              const latest = projects[0];
              const rest = projects.slice(1);

              const renderItem = (row, { condensed }) => {
                const preferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
                const colorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: preferredColor });
                const href = `/projects/${row.id}`;
                const statusIcons = [];
                if (row.is_pinned) statusIcons.push('📌');
                if (row.is_unread) statusIcons.push('🆕');
                const titleWithIcons = statusIcons.length > 0 
                  ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
                  : row.title;

                return (
                  <a
                    key={row.id}
                    href={href}
                    className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                    onClick={(e) => {
                      // Allow nested links (GitHub, Demo) to work
                      if (e.target.closest('a.project-link')) {
                        e.stopPropagation();
                        return;
                      }
                      navigateToProject(e, href);
                    }}
                  >
                    <PostMetaBar
                      title={titleWithIcons}
                      author={row.author_name}
                      authorColorIndex={colorIndex}
                      authorPreferredColorIndex={preferredColor}
                      views={row.views || 0}
                      replies={row.reply_count || 0}
                      likes={row.like_count || 0}
                      createdAt={row.created_at}
                      lastActivity={row.last_activity_at || row.created_at}
                      titleHref={href}
                      showTitleLink={false}
                    />
                    {!condensed && row.image_key ? (
                      <Image
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        width={1200}
                        height={800}
                        loading="lazy"
                        unoptimized
                        style={{ marginTop: '8px', marginBottom: '8px' }}
                      />
                    ) : null}
                    {!condensed ? <div className="post-body" style={{ marginTop: '8px', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: row.descriptionHtml }} /> : null}
                    {!condensed ? (
                      <div className="project-links" style={{ marginTop: '8px', marginBottom: '8px' }}>
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
