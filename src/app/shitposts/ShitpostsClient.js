'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';

export default function ShitpostsClient({ posts, notice }) {
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
            <h2 className="section-title">Shitposts</h2>
            <p className="muted">Post whatever you want - photos, memes, random thoughts.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Create Post</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest Posts</h3>
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No posts yet. Be the first to share something.</p>
          ) : (
            posts.map((row) => (
              <div key={row.id} className="list-item" style={{ cursor: 'pointer' }}>
                <a href={`/forum/${row.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                  <div className="list-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{row.author_name}</span>
                    <span>
                      {new Date(row.created_at).toLocaleString()}
                      {row.reply_count > 0 ? ` · ${row.reply_count} ${row.reply_count === 1 ? 'reply' : 'replies'}` : ''}
                    </span>
                  </div>
                </a>
              </div>
            ))
          )}
        </div>
      </section>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Shitpost"
      >
        <PostForm
          action="/api/shitposts"
          titleLabel="Title (optional)"
          bodyLabel="Post whatever you want"
          buttonLabel="Post"
          titleRequired={false}
          showImage={true}
        />
      </CreatePostModal>
    </div>
  );
}
