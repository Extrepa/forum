'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';

export default function TimelineClient({ updates, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">Announcements</h2>
            <p className="muted">Official updates and pinned notes for the community.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Create Post</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Latest</h3>
        <div className="list">
          {updates.length === 0 ? (
            <p className="muted">No announcements yet. Be the first to post.</p>
          ) : (
            updates.map((row) => (
              <div key={row.id} className="list-item">
                <h3>{row.title || 'Update'}</h3>
                {row.image_key ? (
                  <img
                    src={`/api/media/${row.image_key}`}
                    alt=""
                    className="post-image"
                    loading="lazy"
                  />
                ) : null}
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{ __html: row.bodyHtml }}
                />
                <div className="list-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{row.author_name}</span>
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
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
          buttonLabel="Post announcement"
          titleRequired={false}
          showImage={false}
        />
      </CreatePostModal>
    </div>
  );
}
