import ClaimUsernameForm from '../components/ClaimUsernameForm';
import { getSessionUser } from '../lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();
  const hasUsername = !!user;

  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Welcome</h2>
        <p className="muted">
          This is the public spot to share ideas, post announcements, and plan meetups.
          Reading is open to everyone. Posting requires claiming a username once per browser.
        </p>
      </section>

      {!hasUsername && (
        <section className="card split">
          <div>
            <h3 className="section-title">Claim your username</h3>
            <p className="muted">
              Usernames are one per person. Once claimed, the browser gets a private session token
              so no one else can take that name unless the admin resets the system.
            </p>
          </div>
          <ClaimUsernameForm />
        </section>
      )}

      {hasUsername && (
        <section className="card split">
          <div>
            <h3 className="section-title">Where to start</h3>
            <div className="list grid-tiles">
              <a href="/timeline" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Announcements</strong>
                <div className="list-meta">Official updates, pinned notes, releases.</div>
              </a>
              <a href="/forum" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>General</strong>
                <div className="list-meta">Post whatever you want - general discussion and conversations.</div>
              </a>
              <a href="/events" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Events</strong>
                <div className="list-meta">Lightweight calendar entries for plans.</div>
              </a>
              <a href="/music" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Music</strong>
                <div className="list-meta">Share tracks, rate them, and leave notes.</div>
              </a>
              <a href="/projects" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Projects</strong>
                <div className="list-meta">Work in progress and project updates.</div>
              </a>
              <a href="/shitposts" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Shitposts</strong>
                <div className="list-meta">Post whatever you want - photos, memes, random thoughts.</div>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
