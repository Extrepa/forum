'use client';

import { useMemo, useState } from 'react';
import GenericPostForm from './GenericPostForm';
import PostForm from './PostForm';
import MusicPostForm from './MusicPostForm';
import ProjectForm from './ProjectForm';
import DevLogForm from './DevLogForm';

export default function NomadContentComposer({ postTypes = [], isAdmin = false }) {
  const [section, setSection] = useState(`post:${postTypes[0] || 'nomads'}`);

  const options = useMemo(() => {
    const availablePostTypes = postTypes.length > 0 ? postTypes : ['nomads'];
    const postTypeOptions = availablePostTypes.map((type) => {
      const labelByType = {
        nomads: 'Nomad section-only',
        art: 'Art',
        nostalgia: 'Nostalgia',
        bugs: 'Bugs',
        rant: 'Rant',
        lore: 'Lore',
        memories: 'Memories',
        about: 'About'
      };
      return {
        value: `post:${type}`,
        label: labelByType[type] || type,
        helper: 'Create a Nomad-scoped post in this subtype.'
      };
    });

    const base = [
      ...postTypeOptions,
      { value: 'events', label: 'Events', helper: 'Create an event post.' },
      { value: 'forum', label: 'General Forum', helper: 'Create a thread in /lobby.' },
      { value: 'shitposts', label: 'Shitposts', helper: 'Create an image-friendly shitpost thread.' },
      { value: 'music', label: 'Music', helper: 'Create a music post in /music.' },
      { value: 'projects', label: 'Projects', helper: 'Create a project in /projects.' }
    ];
    if (isAdmin) {
      base.push({ value: 'devlog', label: 'Development', helper: 'Create a development post in /devlog.' });
    }
    return base;
  }, [isAdmin, postTypes]);

  const selectedOption = options.find((option) => option.value === section) || options[0];
  const selectedPostType = section.startsWith('post:') ? section.slice(5) : null;

  return (
    <div className="stack">
      <label>
        <div className="muted">Section</div>
        <select name="nomad_create_section" value={section} onChange={(event) => setSection(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="muted" style={{ marginTop: -4 }}>{selectedOption?.helper || ''}</p>

      {selectedPostType ? (
        <GenericPostForm
          action="/api/posts"
          type={selectedPostType}
          hiddenFields={{ section_scope: 'nomads', force_nomad_visibility: '1' }}
          titleLabel="Title (optional)"
          titlePlaceholder="Optional title"
          bodyLabel="Nomad Post"
          bodyPlaceholder="Write your nomad post..."
          buttonLabel="Post"
          showImage={true}
          titleRequired={false}
          bodyRequired={true}
          showPrivateToggle={false}
        />
      ) : null}

      {section === 'events' ? (
        <PostForm
          action="/api/events"
          titleLabel="Event title"
          bodyLabel="Details (optional)"
          buttonLabel="Add Event"
          showDate
          showOptionalEndDate
          bodyRequired={false}
          showImage={true}
          showNomadVisibilityToggle={true}
          initialData={{ visibility_scope: 'nomads' }}
        />
      ) : null}

      {section === 'forum' ? (
        <PostForm
          action="/api/threads"
          titleLabel="Post title"
          bodyLabel="Share your thoughts"
          buttonLabel="Post"
          showImage={true}
        />
      ) : null}

      {section === 'shitposts' ? (
        <PostForm
          action="/api/shitposts"
          titleLabel="Title (optional)"
          bodyLabel="Post whatever you want"
          buttonLabel="Post"
          titleRequired={false}
          showImage={true}
        />
      ) : null}

      {section === 'music' ? <MusicPostForm /> : null}

      {section === 'projects' ? <ProjectForm /> : null}

      {section === 'devlog' && isAdmin ? <DevLogForm /> : null}
    </div>
  );
}
