import './globals.css';
import SearchBar from '../components/SearchBar';
import BackButton from '../components/BackButton';
import NavLinks from '../components/NavLinks';
import NotificationsLogoTrigger from '../components/NotificationsLogoTrigger';
import HeaderAccountButton from '../components/HeaderAccountButton';
import HeaderSetupBanner from '../components/HeaderSetupBanner';
import { getSessionUserWithRole, isAdminUser } from '../lib/admin';
import { getEasterEgg, getForumStrings, isLoreEnabled } from '../lib/forum-texts';

export const metadata = {
  title: 'Errl Forum',
  description: 'Announcements, ideas, and plans for the Errl community.'
};

export default async function RootLayout({ children }) {
  const user = await getSessionUserWithRole();
  const isAdmin = isAdminUser(user);
  const isSignedIn = !!user;
  const useLore = isLoreEnabled();
  const strings = getForumStrings({ useLore });
  const easterEgg = getEasterEgg({ useLore });

  return (
    <html lang="en">
      <body>
        <div className="site">
          <header>
            <div className="brand">
              <div className="brand-left">
                <h1>Errl Forum</h1>
                <p>{strings.header.subtitle}</p>
              </div>
              <NotificationsLogoTrigger />
            </div>
            <div className="header-nav-section">
              <BackButton />
              <nav>
                <NavLinks isAdmin={isAdmin} isSignedIn={isSignedIn} />
              </nav>
              <div className="header-right-controls">
                <HeaderAccountButton />
                <SearchBar />
              </div>
            </div>
            <HeaderSetupBanner />
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
            <div className="footer-tagline" title={easterEgg || undefined}>
              {strings.footer.tagline}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
