'use client';

import { useRef, useState } from 'react';
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

export default function GenericPostForm({
  action,
  type,
  allowedTypes,
  hiddenFields,
  titleLabel = 'Title',
  titlePlaceholder = 'Title',
  bodyLabel = 'Body',
  bodyPlaceholder = 'Write something...',
  buttonLabel = 'Post',
  requireImage = false,
  showImage = false,
  allowImageUploads = true,
  allowMarkdownUpload = true,
  showPrivateToggle = true,
  defaultPrivate = false,
  titleRequired = false,
  bodyRequired = true,
  showNomadVisibilityToggle = false,
}) {
  const bodyRef = useRef(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(type || (allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : ''));
  const [nomadOnly, setNomadOnly] = useState(false);

  const apply = (before, after) => {
    if (!bodyRef.current) return;
    wrapSelection(bodyRef.current, before, after);
  };

  // Type label mapping for display
  const typeLabels = {
    'nomads': 'Nomad section-only',
    'lore': 'Lore',
    'memories': 'Memories',
    'bugs': 'Bugs',
    'rant': 'Rant',
    'art': 'Art',
    'nostalgia': 'Nostalgia',
    'about': 'About'
  };

  // Type-specific configurations for dynamic labels and placeholders
  const typeConfigs = {
    'lore': {
      titlePlaceholder: 'The story, the legend...',
      bodyLabel: 'Lore',
      bodyPlaceholder: 'Write the lore... Share the story that followed us home.',
      buttonLabel: 'Post Lore'
    },
    'memories': {
      titlePlaceholder: 'A moment in time...',
      bodyLabel: 'Memory',
      bodyPlaceholder: 'Share the memory... What moment do you want to preserve?',
      buttonLabel: 'Post Memory'
    },
    'bugs': {
      titlePlaceholder: 'Short summary',
      bodyLabel: 'Bug Details',
      bodyPlaceholder: 'What happened? What did you expect? Steps to reproduce? Screenshots/links?',
      buttonLabel: 'Report Bug'
    },
    'rant': {
      titlePlaceholder: 'What\'s on your mind?',
      bodyLabel: 'Rant',
      bodyPlaceholder: 'Let it out... What\'s got you fired up?',
      buttonLabel: 'Post Rant'
    },
    'art': {
      titlePlaceholder: 'Untitled',
      bodyLabel: 'Caption (optional)',
      bodyPlaceholder: 'Add a caption (optional)',
      buttonLabel: 'Post Art'
    },
    'nostalgia': {
      titlePlaceholder: 'A blast from the past...',
      bodyLabel: 'Caption (optional)',
      bodyPlaceholder: 'What does this remind you of? Share the nostalgia...',
      buttonLabel: 'Post Nostalgia'
    }
  };

  // Get dynamic values based on selected type, fallback to props
  const currentConfig = typeConfigs[selectedType] || {};
  const dynamicTitlePlaceholder = allowedTypes && allowedTypes.length > 1 
    ? (currentConfig.titlePlaceholder || titlePlaceholder)
    : titlePlaceholder;
  const dynamicBodyLabel = allowedTypes && allowedTypes.length > 1
    ? (currentConfig.bodyLabel || bodyLabel)
    : bodyLabel;
  const dynamicBodyPlaceholder = allowedTypes && allowedTypes.length > 1
    ? (currentConfig.bodyPlaceholder || bodyPlaceholder)
    : bodyPlaceholder;
  const dynamicButtonLabel = allowedTypes && allowedTypes.length > 1
    ? (currentConfig.buttonLabel || buttonLabel)
    : buttonLabel;

  const showImageField = showImage && allowImageUploads;
  const showImageDisabled = showImage && !allowImageUploads;

  return (
    <form action={action} method="post" encType="multipart/form-data">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={String(value)} />
          ))
        : null}
      {allowedTypes && allowedTypes.length > 1 ? (
        <label>
          <div className="muted">Post type</div>
          <select 
            name="type" 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            required
          >
            {allowedTypes.map(t => (
              <option key={t} value={t}>{typeLabels[t] || t}</option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="type" value={type || selectedType} />
      )}

      <label>
        <div className="muted">{titleLabel}</div>
        <input name="title" placeholder={dynamicTitlePlaceholder} required={titleRequired} />
      </label>

      {showPrivateToggle ? (
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="checkbox" name="is_private" value="1" defaultChecked={defaultPrivate} />
          <span className="muted">Members-only</span>
        </label>
      ) : null}
      {showNomadVisibilityToggle ? (
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="checkbox"
            name="visibility_scope_nomads"
            value="1"
            checked={nomadOnly}
            onChange={(event) => setNomadOnly(event.target.checked)}
          />
          <span className="muted">Nomads-only</span>
        </label>
      ) : null}

      {showImage ? (
        showImageField ? (
          <label>
            <div className="muted">Image {selectedType === 'art' ? '(required)' : requireImage ? '(required)' : '(optional)'}</div>
            <input name="image" type="file" accept="image/*" required={selectedType === 'art' || requireImage} />
          </label>
        ) : (
          <div className="muted image-note">Image uploads are temporarily disabled by the admin.</div>
        )
      ) : null}
      {allowMarkdownUpload ? (
        <MarkdownUploader
          targetRef={bodyRef}
          helper="Upload a Markdown file to preload the body."
        />
      ) : null}

      <label className="text-field">
        <div className="muted">{dynamicBodyLabel}</div>
        <div className="formatting-toolbar">
          <button type="button" title="Bold" onClick={() => apply('**', '**')}>B</button>
          <button type="button" title="Italic" onClick={() => apply('*', '*')}>I</button>
          <button type="button" title="Underline" onClick={() => apply('<u>', '</u>')}>U</button>
          <button type="button" title="Bullet list" onClick={() => apply('\n- ', '')}>-</button>
          <button type="button" title="Numbered list" onClick={() => apply('\n1. ', '')}>1.</button>
          <button type="button" title="Quote" onClick={() => apply('\n> ', '')}>&gt;</button>
          <button type="button" title="Inline code" onClick={() => apply('`', '`')}>`</button>
          <button type="button" title="Code block" onClick={() => apply('\n```\n', '\n```\n')}>```</button>
          <button type="button" title="Heading 2" onClick={() => apply('## ', '')}>H2</button>
          <button type="button" title="Heading 3" onClick={() => apply('### ', '')}>H3</button>
          <button type="button" title="Link" onClick={() => apply('[text](', ')')}>[]</button>
          <button
            type="button"
            title="Colors"
            onClick={() => setColorsOpen((v) => !v)}
            aria-expanded={colorsOpen ? 'true' : 'false'}
          >
            Clr
          </button>
          {colorsOpen ? (
            <span className="color-palette">
              <button type="button" title="Pink" onClick={() => { apply('<span class=\"text-pink\">', '</span>'); setColorsOpen(false); }}>P</button>
              <button type="button" title="Blue" onClick={() => { apply('<span class=\"text-blue\">', '</span>'); setColorsOpen(false); }}>B</button>
              <button type="button" title="Green" onClick={() => { apply('<span class=\"text-green\">', '</span>'); setColorsOpen(false); }}>G</button>
              <button type="button" title="Muted" onClick={() => { apply('<span class=\"text-muted\">', '</span>'); setColorsOpen(false); }}>M</button>
            </span>
          ) : null}
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          placeholder={dynamicBodyPlaceholder}
          required={bodyRequired}
          style={{ minHeight: 180 }}
        />
      </label>

      <button type="submit">{dynamicButtonLabel}</button>
    </form>
  );
}
