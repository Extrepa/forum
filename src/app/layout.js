import './globals.css';
import SessionBadge from '../components/SessionBadge';
import ForumLogo from '../components/ForumLogo';
import SearchBar from '../components/SearchBar';

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
              <div className="brand-left">
                <h1>Errl Forum</h1>
                <p>Announcements, ideas, and planning in one spot.</p>
              </div>
              <ForumLogo variant="header" href="/" showText={false} />
            </div>
            <div className="header-nav-section">
              <nav>
                <a href="/">Home</a>
                <a href="/timeline">Announcements</a>
                <a href="/events">Events</a>
                <a href="/forum">General</a>
                <a href="/music">Music</a>
                <a href="/projects">Projects</a>
                <a href="/search">Search</a>
                <a href="/shitposts">Shitposts</a>
              </nav>
              <SessionBadge />
            </div>
            <div className="header-search-section">
              <SearchBar />
            </div>
          </header>
          <main>{children}</main>
          <footer>Designed to visually match the main portal. Theme tokens can be shared.</footer>
        </div>
      </body>
    </html>
  );
}
