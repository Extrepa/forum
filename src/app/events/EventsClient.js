'use client';

import { useState } from 'react';
import PostForm from '../../components/PostForm';
import CreatePostModal from '../../components/CreatePostModal';
import Username from '../../components/Username';
import { getUsernameColorIndex } from '../../lib/usernameColor';

export default function EventsClient({ events, notice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">Events</h2>
            <p className="muted">Lightweight planning for meetups and plans.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)}>Create Post</button>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>

      <section className="card">
        <h3 className="section-title">Upcoming</h3>
        <div className="list">
          {events.length === 0 ? (
            <p className="muted">No events yet. Add the first plan.</p>
          ) : (
            (() => {
              let lastName = null;
              let lastIndex = null;

              return events.map((row) => {
                const colorIndex = getUsernameColorIndex(row.author_name, {
                  avoidIndex: lastIndex,
                  avoidName: lastName,
                });
                lastName = row.author_name;
                lastIndex = colorIndex;

                return (
                  <div key={row.id} className="list-item">
                    <h3>{row.title}</h3>
                    {row.image_key ? (
                      <img
                        src={`/api/media/${row.image_key}`}
                        alt=""
                        className="post-image"
                        loading="lazy"
                      />
                    ) : null}
                    {row.details ? (
                      <div className="post-body" dangerouslySetInnerHTML={{ __html: row.detailsHtml }} />
                    ) : null}
                    <div
                      className="list-meta"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <Username name={row.author_name} colorIndex={colorIndex} />
                      </span>
                      <span>{new Date(row.starts_at).toLocaleString()}</span>
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
        title="Add Event"
      >
        <PostForm
          action="/api/events"
          titleLabel="Event title"
          bodyLabel="Details (optional)"
          buttonLabel="Add event"
          showDate
          bodyRequired={false}
          showImage={false}
        />
      </CreatePostModal>
    </div>
  );
}
