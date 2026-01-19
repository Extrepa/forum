'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function ForumClient({ threads, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <h2 className="section-title">General</h2>
            <p className="muted">Post whatever you want - general discussion, questions, ideas, and conversations.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Create Post</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest Posts</h3>
        <div className="list">
          {threads.length === 0 ? (
            <p className="muted">No threads yet. Start the first conversation.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return threads.map((row) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item" style={{ cursor: 'pointer' }}>
                    <a href={`/forum/${row.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3>{row.title}</h3>
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
        title="Create Post"
      >
        <PostForm
          action="/api/threads"
          titleLabel="Post title"
          bodyLabel="Share your thoughts"
          buttonLabel="Create post"
          showImage={false}
        />
      </CreatePostModal>
    </div>
  );
}
