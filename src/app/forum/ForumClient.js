'use client';

import { getUsernameColorIndex, assignUniqueColorsForPage } from '../../lib/usernameColor';
import { useUiPrefs } from '../../components/UiPrefsProvider';
import { getForumStrings } from '../../lib/forum-texts';
import PostMetaBar from '../../components/PostMetaBar';

export default function ForumClient({ announcements = [], stickies = [], threads = [], notice, basePath = '/forum' }) {
  const { loreEnabled } = useUiPrefs();
  const strings = getForumStrings({ useLore: loreEnabled });

  // Collect all usernames from all thread lists for unique color assignment
  const allUsernames = [
    ...announcements.map(t => t.author_name),
    ...announcements.map(t => t.last_post_author).filter(Boolean),
    ...stickies.map(t => t.author_name),
    ...stickies.map(t => t.last_post_author).filter(Boolean),
    ...threads.map(t => t.author_name),
    ...threads.map(t => t.last_post_author).filter(Boolean)
  ].filter(Boolean);
  
  // Build preferences map
  const preferredColors = new Map();
  [...announcements, ...stickies, ...threads].forEach(t => {
    if (t.author_name && t.author_color_preference !== null && t.author_color_preference !== undefined) {
      preferredColors.set(t.author_name, Number(t.author_color_preference));
    }
  });
  
  const usernameColorMap = assignUniqueColorsForPage([...new Set(allUsernames)], preferredColors);

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

  const renderItem = (row, { condensed = false }) => {
    const authorPreferredColor = row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null;
    const authorColorIndex = usernameColorMap.get(row.author_name) ?? getUsernameColorIndex(row.author_name, { preferredColorIndex: authorPreferredColor });
    const lastPostPreferredColor = null; // We don't have preference for last_post_author in this query
    const lastPostColorIndex = row.last_post_author ? (usernameColorMap.get(row.last_post_author) ?? getUsernameColorIndex(row.last_post_author, { preferredColorIndex: lastPostPreferredColor })) : null;
    const isHot = (row.reply_count || 0) > 10;
    const statusIcons = [];
    if (row.is_pinned) statusIcons.push('📌');
    if (row.is_locked) statusIcons.push('🔒');
    if (row.is_unread) statusIcons.push('🆕');
    if (isHot) statusIcons.push('🔥');

    const lastActivity = row.last_activity_at || row.created_at;
    const lastPostAuthor = row.last_post_author || row.author_name;

    const titleWithIcons = statusIcons.length > 0 
      ? <><span style={{ marginRight: '6px' }}>{statusIcons.join(' ')}</span>{row.title}</>
      : row.title;

    return (
      <a
        key={row.id}
        href={`${basePath}/${row.id}`}
        className={`list-item ${row.is_unread ? 'thread-unread' : ''}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
      >
        <PostMetaBar
          title={titleWithIcons}
          author={row.author_name}
          authorColorIndex={authorColorIndex}
          authorPreferredColorIndex={row.author_color_preference !== null && row.author_color_preference !== undefined ? Number(row.author_color_preference) : null}
          views={row.views || 0}
          replies={row.reply_count || 0}
          likes={row.like_count || 0}
          createdAt={row.created_at}
          lastActivity={row.last_activity_at || row.created_at}
          lastActivityBy={lastPostAuthor}
          titleHref={`${basePath}/${row.id}`}
          showTitleLink={false}
        />
        {!condensed ? (
          <p className="muted" style={{ marginTop: '8px', marginBottom: '8px', fontSize: '13px' }}>
            {truncateBody(row.body)}
          </p>
        ) : null}
      </a>
    );
  };

  const renderSection = (title, items, showEmpty = true) => {
    if (items.length === 0 && !showEmpty) return null;
    
    return (
      <section className="card">
        <h3 className="section-title">{title}</h3>
        {items.length === 0 ? (
          <p className="muted">No threads yet.</p>
        ) : (
          <div className="list">
            {items.map((row) => renderItem(row, { condensed: true }))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="stack">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{strings.cards.general.title}</h2>
          <p className="muted" style={{ margin: 0, textAlign: 'right', flex: '1 1 auto', minWidth: '200px' }}>{strings.cards.general.description}</p>
        </div>
      </section>

      {notice ? <div className="notice">{notice}</div> : null}

      {announcements.length > 0 && renderSection('Announcements', announcements, false)}
      {stickies.length > 0 && renderSection('Pinned Threads', stickies, false)}
      {renderSection('Latest Threads', threads, true)}
    </div>
  );
}
