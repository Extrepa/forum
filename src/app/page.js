import ClaimUsernameForm from '../components/ClaimUsernameForm';

export default function HomePage() {
  return (
    <div className="stack">
      <section className="card">
        <h2 className="section-title">Welcome</h2>
        <p className="muted">
          This is the public spot to share ideas, post announcements, and plan meetups.
          Reading is open to everyone. Posting requires claiming a username once per browser.
        </p>
      </section>

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

      <section className="card split">
        <div>
          <h3 className="section-title">Where to start</h3>
          <div className="list grid-tiles">
            <div className="list-item">
              <strong>Announcements</strong>
              <div className="list-meta">Official updates, pinned notes, releases.</div>
            </div>
            <div className="list-item">
              <strong>Forum</strong>
              <div className="list-meta">Threads for new ideas and conversations.</div>
            </div>
            <div className="list-item">
              <strong>Events</strong>
              <div className="list-meta">Lightweight calendar entries for plans.</div>
            </div>
            <div className="list-item">
              <strong>Music</strong>
              <div className="list-meta">Share tracks, rate them, and leave notes.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
