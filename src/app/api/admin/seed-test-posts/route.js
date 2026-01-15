import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '../../../../lib/db';
import { createToken } from '../../../../lib/tokens';

export async function POST(request) {
  const { env } = await getCloudflareContext({ async: true });
  const adminToken = env.ADMIN_RESET_TOKEN;
  const provided = request.headers.get('x-admin-token');

  if (!adminToken || provided !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const now = Date.now();

  // Create or get test user
  let testUser = await db
    .prepare('SELECT id, username FROM users WHERE username = ?')
    .bind('testuser')
    .first();

  if (!testUser) {
    const userId = crypto.randomUUID();
    const token = createToken();
    await db
      .prepare(
        'INSERT INTO users (id, username, username_norm, session_token, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(userId, 'testuser', 'testuser', token, 'admin', now - 86400000)
      .run();
    testUser = { id: userId, username: 'testuser' };
  } else {
    // Update to admin if not already
    await db
      .prepare('UPDATE users SET role = ? WHERE id = ?')
      .bind('admin', testUser.id)
      .run();
  }

  const userId = testUser.id;

  // Timeline/Announcements posts
  const timelinePosts = [
    {
      title: 'Welcome to Errl Forum',
      body: `This is the **official** announcements feed for the Errl community.

## What's New

We're excited to launch this forum where you can:
- Share ideas and updates
- Plan events together
- Discuss music and projects
- Connect with the community

Feel free to explore all the sections!`
    },
    {
      title: 'Community Guidelines',
      body: `Just a quick reminder about our community values:

* Be respectful
* Share openly
* Have fun

That's it! Simple and friendly.`
    },
    {
      title: null,
      body: `Quick update: The forum is now live and ready for everyone to use. Post away! 🎉`
    }
  ];

  for (const post of timelinePosts) {
    await db
      .prepare(
        'INSERT INTO timeline_updates (id, author_user_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), userId, post.title, post.body, now - Math.random() * 86400000 * 3)
      .run();
  }

  // Forum threads
  const forumThreads = [
    {
      title: 'What features would you like to see?',
      body: `Hey everyone! I'm curious what features you'd find most useful here.

Some ideas I've been thinking about:
- [ ] Search functionality
- [ ] Notifications
- [ ] Rich text editor
- [ ] File attachments

What do you think?`
    },
    {
      title: 'Best practices for posting',
      body: `## Tips for great posts

1. **Use markdown** - It makes your posts more readable
2. Add context - Help others understand what you're sharing
3. Be specific - Clear titles and descriptions help everyone

### Formatting examples

You can use **bold**, *italic*, and [links](https://example.com) to make your posts stand out!`
    },
    {
      title: 'General discussion thread',
      body: `This is a space for general chat and discussion. Feel free to talk about anything community-related here!`
    }
  ];

  for (const thread of forumThreads) {
    await db
      .prepare(
        'INSERT INTO forum_threads (id, author_user_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), userId, thread.title, thread.body, now - Math.random() * 86400000 * 5)
      .run();
  }

  // Events
  const events = [
    {
      title: 'Community Meetup',
      details: `Join us for a casual meetup! We'll discuss the forum and plan future events.

**Location**: TBD
**Time**: 7:00 PM

Let me know if you're interested!`,
      startsAt: now + 86400000 * 7 // 7 days from now
    },
    {
      title: 'Music Listening Session',
      details: `Let's share some tracks and listen together. Bring your favorite songs!`,
      startsAt: now + 86400000 * 14 // 14 days from now
    },
    {
      title: 'Project Showcase',
      details: `Show off what you've been working on! This is a great time to share your projects and get feedback.`,
      startsAt: now + 86400000 * 21 // 21 days from now
    }
  ];

  for (const event of events) {
    await db
      .prepare(
        'INSERT INTO events (id, author_user_id, title, details, starts_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), userId, event.title, event.details, event.startsAt, now - Math.random() * 86400000 * 2)
      .run();
  }

  // Music posts (using placeholder YouTube URLs - these won't actually embed but show the structure)
  const musicPosts = [
    {
      title: 'Ambient Vibes',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      body: `Found this great ambient track. Perfect for coding or relaxing.

## Why I love it

* Soothing atmosphere
* Great for focus
* Beautiful composition`,
      tags: 'ambient,electronic,chill'
    },
    {
      title: 'Upbeat Energy',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      body: `This one gets me pumped! Great for workouts or when you need energy.`,
      tags: 'electronic,energetic'
    },
    {
      title: 'Chill Beats',
      type: 'soundcloud',
      url: 'https://soundcloud.com/example/track',
      body: `Perfect background music for working.`,
      tags: 'chill,beats,lo-fi'
    }
  ];

  for (const music of musicPosts) {
    await db
      .prepare(
        'INSERT INTO music_posts (id, author_user_id, title, body, url, type, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        crypto.randomUUID(),
        userId,
        music.title,
        music.body,
        music.url,
        music.type,
        music.tags,
        now - Math.random() * 86400000 * 4
      )
      .run();
  }

  // Projects (requires admin user)
  const projects = [
    {
      title: 'Forum Platform',
      description: `Building this forum platform to connect the community.

## Features

- **Multiple sections** for different types of content
- **Markdown support** for rich formatting
- **Image uploads** for visual content
- **Comments and engagement** features

## Status

Currently in active development. Always improving!`,
      status: 'active',
      github_url: 'https://github.com/example/forum',
      demo_url: null
    },
    {
      title: 'Music Discovery Tool',
      description: `A tool to help discover and share music with friends.

### Goals

* Easy sharing
* Rating system
* Comments and discussion

Still in planning phase.`,
      status: 'on-hold',
      github_url: null,
      demo_url: null
    }
  ];

  for (const project of projects) {
    const projectId = crypto.randomUUID();
    await db
      .prepare(
        'INSERT INTO projects (id, author_user_id, title, description, status, github_url, demo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        projectId,
        userId,
        project.title,
        project.description,
        project.status,
        project.github_url,
        project.demo_url,
        now - Math.random() * 86400000 * 10
      )
      .run();

    // Add an update to the first project
    if (project.title === 'Forum Platform') {
      await db
        .prepare(
          'INSERT INTO project_updates (id, project_id, author_user_id, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          projectId,
          userId,
          'Added Projects Section',
          `Just added a new Projects section where I can track work in progress and share updates with the community.

## What's New

- Projects listing page
- Project detail pages
- Update posts
- Comments on projects

More features coming soon!`,
          now - 86400000
        )
        .run();
    }
  }

  return NextResponse.json({
    ok: true,
    message: 'Test posts created successfully',
    user: testUser.username
  });
}
