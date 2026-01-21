'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';

export default function ShitpostsClient({ posts, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">{strings.cards.shitposts.title}</h2>
            <p className="muted">{strings.cards.shitposts.description}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>{strings.actions.newPost}</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest Posts</h3>
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">{strings.cards.shitposts.empty}</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return posts.map((row) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item" style={{ cursor: 'pointer' }}>
                    <a href={`/lobby/${row.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3>{row.title}</h3>
                      {row.image_key ? (
                        <img
                          src={`/api/media/${row.image_key}`}
                          alt=""
                          className="post-image"
                          loading="lazy"
                          style={{ maxHeight: '200px', width: 'auto' }}
                        />
                      ) : null}
                      <p className="muted" style={{ marginBottom: '8px' }}>
                        {truncateBody(row.body)}
                      </p>
                      <div
                        className="list-meta"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
        title={strings.actions.newPost}
      >
        <PostForm
          action="/api/shitposts"
          titleLabel="Title (optional)"
          bodyLabel="Post whatever you want"
          buttonLabel={strings.actions.newPost}
          titleRequired={false}
          showImage={true}
        />
      </CreatePostModal>
    </div>
  );
}
