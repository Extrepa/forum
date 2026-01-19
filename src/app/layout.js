import './globals.css';
import ForumLogo from '../components/ForumLogo';
import SearchBar from '../components/SearchBar';
import BackButton from '../components/BackButton';
import NavLinks from '../components/NavLinks';

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
                <p>Announcements, drops, and devlog vibes for the Errl community.</p>
              </div>
              <ForumLogo variant="header" href="/" showText={false} />
            </div>
            <div className="header-nav-section">
              <BackButton />
              <nav>
                <NavLinks />
              </nav>
              <SearchBar />
            </div>
          </header>
          <main>{children}</main>
          <footer>
            <div className="footer-line">
              <a className="footer-brand" href="https://errl.wtf">
                Errl Portal / Errl Forum
              </a>
              <span className="footer-sep">•</span>
              <span>Created by Extrepa</span>
              <span className="footer-sep">•</span>
              <span>Errl since 2015</span>
            </div>
            <div className="footer-tagline">Keep it weird. Keep it real. Keep it Errl.</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
