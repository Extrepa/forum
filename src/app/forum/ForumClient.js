'use client';

import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function ForumClient({ threads, notice, basePath = '/forum' }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  const truncateBody = (body, maxLength = 150) => {
    if (!body) return '';
    // Strip markdown formatting for preview
    const plainText = body
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
      .replace(/<u>([^<]+)<\/u>/g, '$1') // Remove underline
      .trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">{strings.cards.general.title}</h2>
        <p className="muted">{strings.cards.general.description}</p>
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        {notice ? <div className="notice">{notice}</div> : null}
        <div className="list">
          {threads.length === 0 ? (
            <p className="muted">{strings.cards.general.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              const latest = threads[0];
              const rest = threads.slice(1);

              const renderItem = (row, { condensed }) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <a
                    key={row.id}
                    href={`${basePath}/${row.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
                  >
                    <h3 style={{ marginBottom: condensed ? '4px' : '6px' }}>{row.title}</h3>
                    {!condensed ? (
                      <p className="muted" style={{ marginBottom: '6px', fontSize: '13px' }}>
                        {truncateBody(row.body)}
                      </p>
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
