'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { safeEmbedFromUrl } from '../lib/embeds';
import MarkdownUploader from './MarkdownUploader';

function wrapSelection(textarea, before, after = '') {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const nextValue = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = nextValue;
  const cursor = start + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

export default function MusicPostForm({ allowImageUploads = true, allowMarkdownUpload = true }) {
  const bodyRef = useRef(null);
  const [type, setType] = useState('youtube');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [embedStyle, setEmbedStyle] = useState('auto');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const embed = useMemo(() => {
    const trimmed = String(url || '').trim();
    if (!trimmed) return null;
    return safeEmbedFromUrl(type, trimmed, embedStyle);
  }, [type, url, embedStyle]);

  const apply = (before, after) => {
    if (!bodyRef.current) {
      return;
    }
    wrapSelection(bodyRef.current, before, after);
  };

  return (
    <form action="/api/music/posts" method="post" encType="multipart/form-data" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      <label>
        <div className="muted">Title</div>
        <input
          name="title"
          placeholder="Song title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label>
        <div className="muted">Embed type</div>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          <option value="youtube">YouTube</option>
          <option value="youtube-music">YouTube Music</option>
          <option value="soundcloud">SoundCloud</option>
          <option value="spotify">Spotify</option>
        </select>
      </label>

      <label>
        <div className="muted">URL</div>
        <input
          name="url"
          placeholder="Paste the YouTube, YouTube Music, Spotify, or SoundCloud link"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>

      {type === 'soundcloud' && (
        <label>
          <div className="muted">Player style</div>
          <select
            name="embed_style"
            value={embedStyle}
            onChange={(e) => setEmbedStyle(e.target.value)}
          >
            <option value="auto">Auto (compact for tracks, full for playlists)</option>
            <option value="compact">Compact (166px - good for single tracks)</option>
            <option value="full">Full (450px - shows tracklist/comments)</option>
          </select>
          <div className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            {embedStyle === 'auto' && url && (
              url.includes('/sets/') 
                ? 'Detected: Playlist - will use full player'
                : 'Detected: Single track - will use compact player'
            )}
          </div>
        </label>
      )}

      <label>
        <div className="muted">Tags (comma separated)</div>
        <input
          name="tags"
          placeholder="ambient, friend, live"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </label>

      {allowImageUploads ? (
        <label>
          <div className="muted">Image (optional)</div>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            disabled={!allowImageUploads}
          />
        </label>
      ) : (
        <div className="muted image-note" style={{ marginBottom: 8 }}>
          Image uploads are temporarily disabled by the admin.
        </div>
      )}
      {allowMarkdownUpload ? (
        <MarkdownUploader
          targetRef={bodyRef}
          helper="Upload a Markdown file to describe your notes."
        />
      ) : null}

      {embed || imagePreviewUrl ? (
        <section className="card" style={{ padding: 14, boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Preview
          </div>
          <div className="stack" style={{ gap: 12, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {embed ? (
              <div 
                className={`embed-frame ${embed.aspect}`} 
                style={{ 
                  width: '100%', 
                  maxWidth: '100%', 
                  boxSizing: 'border-box',
                  ...(embed.height ? { height: `${embed.height}px`, minHeight: `${embed.height}px` } : {})
                }}
              >
                <iframe
                  src={embed.src}
                  title={title || 'Preview'}
                  allow={embed.allow}
                  allowFullScreen={embed.allowFullScreen}
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%' }}
                />
              </div>
            ) : (
            <div className="muted" style={{ fontSize: 13 }}>
              Enter a valid YouTube, YouTube Music, Spotify, or SoundCloud URL to preview.
            </div>
            )}
            {imagePreviewUrl ? (
              <Image
                src={imagePreviewUrl}
                alt=""
                className="post-image"
                width={1200}
                height={800}
                unoptimized
                style={{ margin: 0, maxWidth: '100%' }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <label className="text-field">
        <div className="muted">Notes</div>
        <div className="formatting-toolbar">
          <button type="button" onClick={() => apply('**', '**')}>Bold</button>
          <button type="button" onClick={() => apply('*', '*')}>Italic</button>
          <button type="button" onClick={() => apply('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" onClick={() => apply('[text](', ')')}>Link</button>
        </div>
        <textarea ref={bodyRef} name="body" placeholder="Why you love this..." />
      </label>

      <button type="submit">Post to Music Feed</button>
    </form>
  );
}
