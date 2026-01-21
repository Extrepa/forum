'use client';

import { useMemo, useState } from 'react';
import CreatePostModal from '../../components/CreatePostModal';
import GenericPostForm from '../../components/GenericPostForm';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function ArtClient({ posts, notice, isSignedIn }) {
  const [open, setOpen] = useState(false);

  const title = useMemo(() => 'Art', []);
  const description = useMemo(() => 'Image-only posts.', []);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" onClick={() => setOpen(true)} disabled={!isSignedIn}>
            New Art Post
          </button>
        </div>
        <p className="muted">{description}</p>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <CreatePostModal isOpen={open} onClose={() => setOpen(false)} title="New Art Post" variant="wide">
        <GenericPostForm
          action="/api/posts"
          type="art"
          titleLabel="Title (optional)"
          titlePlaceholder="Untitled"
          bodyLabel="Caption (optional)"
          bodyPlaceholder="Add a caption (optional)"
          buttonLabel="Post"
          showImage={true}
          requireImage={true}
          titleRequired={false}
          bodyRequired={false}
        />
      </CreatePostModal>

      <section className="card">
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No art yet.</p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="list-item">
                <div className="post-header">
                  <h3>
                    <a href={`/art/${p.id}`}>{p.title || 'Untitled'}</a>
                  </h3>
                  {p.is_private ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      Members-only
                    </span>
                  ) : null}
                </div>
                <div className="list-meta">
                  <Username name={p.author_name} colorIndex={getUsernameColorIndex(p.author_name)} />
                </div>
                {p.image_key ? <img src={`/api/media/${p.image_key}`} alt="" className="post-image" loading="lazy" /> : null}
                {p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

