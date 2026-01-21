'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function TimelineClient({ updates, notice, basePath = '/timeline' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">{strings.cards.announcements.title}</h2>
            <p className="muted">{strings.cards.announcements.description}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Post Announcement</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        <div className="list">
          {updates.length === 0 ? (
            <p className="muted">{strings.cards.announcements.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return updates.map((row) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item">
                    <h3>
                      <a href={`${basePath}/${row.id}`}>{row.title || 'Update'}</a>
                    </h3>
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="post-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
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
        title="Post Announcement"
      >
        <PostForm
          action="/api/timeline"
          titleLabel="Title"
          bodyLabel="Update"
          buttonLabel="Post Announcement"
          titleRequired={false}
          showImage={false}
        />
      </CreatePostModal>
    </div>
  );
}
