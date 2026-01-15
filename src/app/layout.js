import './globals.css';
import SessionBadge from '../components/SessionBadge';
import ForumLogo from '../components/ForumLogo';

export const metadata = {
  title: 'Errl Forum',
  description: 'Announcements, ideas, and plans for the Errl community.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site">
          <header>
            <div className="brand">
              <ForumLogo variant="header" href="/" showText={false} />
              <h1>Errl Forum</h1>
              <p>Announcements, ideas, and planning in one spot.</p>
            </div>
            <nav>
              <a href="/">Home</a>
              <a href="/timeline">Announcements</a>
              <ForumLogo variant="nav" href="/forum" />
              <a href="/events">Events</a>
              <a href="/music">Music</a>
              <a href="/projects">Projects</a>
            </nav>
            <SessionBadge />
          </header>
          <main>{children}</main>
          <footer>Designed to visually match the main portal. Theme tokens can be shared.</footer>
        </div>
      </body>
    </html>
  );
}
