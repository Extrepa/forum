'use client';

import { useMemo, useState } from 'react';
import CreatePostModal from '../../components/CreatePostModal';
import GenericPostForm from '../../components/GenericPostForm';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function AboutClient({ posts, notice, isSignedIn }) {
  const [open, setOpen] = useState(false);

  const title = useMemo(() => 'About', []);
  const description = useMemo(() => 'Site description and links.', []);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" onClick={() => setOpen(true)} disabled={!isSignedIn}>
            New About Post
          </button>
        </div>
        <p className="muted">{description}</p>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <CreatePostModal isOpen={open} onClose={() => setOpen(false)} title="New About Post" variant="wide">
        <GenericPostForm
          action="/api/posts"
          type="about"
          titleLabel="Title (optional)"
          titlePlaceholder="Optional title"
          bodyLabel="Body"
          bodyPlaceholder="Describe the site, add links, upload an image if you want..."
          buttonLabel="Post"
          showImage={true}
          requireImage={false}
          titleRequired={false}
          bodyRequired={true}
        />
      </CreatePostModal>

      <section className="card">
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No about posts yet.</p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="list-item">
                <div className="post-header">
                  <h3>
                    <a href={`/about#${p.id}`}>{p.title || 'About'}</a>
                  </h3>
                  {p.is_private ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      Members-only
                    </span>
                  ) : null}
                </div>
                <div className="list-meta">
                  <Username name={p.author_name} colorIndex={getUsernameColorIndex(p.author_name)} /> ·{' '}
                  {new Date(p.created_at).toLocaleString()}
                </div>
                {p.image_key ? <img src={`/api/media/${p.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
                {p.bodyHtml ? <div id={p.id} className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

