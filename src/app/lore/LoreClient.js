'use client';

import { useMemo, useState } from 'react';
import CreatePostModal from '../../components/CreatePostModal';
import GenericPostForm from '../../components/GenericPostForm';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function LoreClient({ posts, notice, isSignedIn }) {
  const [open, setOpen] = useState(false);

  const title = useMemo(() => 'Lore', []);
  const description = useMemo(() => "Errl's story and history.", []);

  return (
    <div className="stack">
      <section className="card">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" onClick={() => setOpen(true)} disabled={!isSignedIn}>
            New Lore Post
          </button>
        </div>
        <p className="muted">{description}</p>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <CreatePostModal isOpen={open} onClose={() => setOpen(false)} title="New Lore Post" variant="wide">
        <GenericPostForm
          action="/api/posts"
          type="lore"
          titleLabel="Title (optional)"
          titlePlaceholder="Optional title"
          bodyLabel="Lore"
          bodyPlaceholder="Write the lore..."
          buttonLabel="Post"
          showImage={false}
          titleRequired={false}
          bodyRequired={true}
          showPrivateToggle={true}
          defaultPrivate={false}
        />
      </CreatePostModal>

      <section className="card">
        <div className="list">
          {posts.length === 0 ? (
            <p className="muted">No lore yet.</p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="list-item">
                <div className="post-header">
                  <h3>
                    <a href={`/lore/${p.id}`}>{p.title || 'Untitled'}</a>
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
                {p.bodyHtml ? <div className="post-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

