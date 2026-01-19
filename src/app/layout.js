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
                <p>Announcements, ideas, and planning in one spot.</p>
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
          <footer>Designed to visually match the main portal. Theme tokens can be shared.</footer>
        </div>
      </body>
    </html>
  );
}
