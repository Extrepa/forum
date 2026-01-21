'use client';

import { useState } from 'react';
import MusicPostForm from '../../components/MusicPostForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function MusicClient({ posts, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">{strings.cards.music.title}</h2>
            <p className="muted">{strings.cards.music.description}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Post to Music Feed</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest Drops</h3>
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.music.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return posts.map((row) => {
                const tags = row.tags ? row.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item">
                    <div className="post-header">
                      <h3>{row.title}</h3>
                      <a className="post-link" href={`/music/${row.id}`}>
                        View
                      </a>
                    </div>
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    {row.embed ? (
                      <div className={`embed-frame ${row.embed.aspect}`}>
                        <iframe
                          src={row.embed.src}
                          title={row.title}
                          allow={row.embed.allow}
                          allowFullScreen={row.embed.allowFullScreen}
                        />
                      </div>
                    ) : null}
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    {row.bodyHtml ? (
                      <div className="post-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    ) : null}
                    {tags.length ? (
                      <div className="tag-row">
                        {tags.map((tag) => (
                          <span key={tag} className="tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="rating-row">
                      <span>Rating: {row.avg_rating ? Number(row.avg_rating).toFixed(1) : '—'}</span>
                      <span>{row.rating_count} votes</span>
                      <span>{row.comment_count} comments</span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </section>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post to Music Feed"
      >
        <MusicPostForm />
      </CreatePostModal>
    </div>
  );
}
