import './globals.css';
import { UiPrefsProvider } from '../components/UiPrefsProvider';
import SiteHeader from '../components/SiteHeader';
import NotificationTutorial from '../components/NotificationTutorial';
import { getSessionUserWithRole, isAdminUser } from '../lib/admin';
import { getEasterEgg, getForumStrings } from '../lib/forum-texts';
import { updateUserLastSeen } from '../lib/auth';

export const metadata = {
  title: 'Errl Forum',
  description: 'Announcements, ideas, and plans for the Errl community.'
};

// Force dynamic rendering to ensure auth state is always fresh
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const user = await getSessionUserWithRole();
  const isAdmin = isAdminUser(user);
  const isSignedIn = !!user;
  const envLore = process.env.NEXT_PUBLIC_ERRL_USE_LORE === 'true';
  const useLore = !!user?.ui_lore_enabled || envLore;
  const strings = getForumStrings({ useLore });
  const easterEgg = getEasterEgg({ useLore });
  
  // Split tagline into phrases for responsive wrapping
  const taglinePhrases = strings.footer.tagline.split('. ').filter(p => p.length > 0);

  // Update user's last_seen timestamp to track active browsing
  // Fire and forget - don't await to avoid blocking page rendering
  if (user?.id) {
    // Start the async operation but don't await it
    // This allows the page to render while the DB update happens in the background
    updateUserLastSeen(user.id).catch(() => {
      // Silently fail - don't break page loads if this fails
    });
  }

  return (
    <html lang="en">
      <body>
        <UiPrefsProvider initialLoreEnabled={useLore}>
          <div className="site">
            <SiteHeader subtitle={strings.header.subtitle} isAdmin={isAdmin} isSignedIn={isSignedIn} />
            <NotificationTutorial isSignedIn={isSignedIn} />
            <main>{children}</main>
            <footer>
              <div className="footer-grid">
                {/* Left: Portal link */}
                <div className="footer-column footer-column-left">
                  <a className="footer-portal-link" href="https://errl.wtf">
                    <span aria-hidden="true">↩</span>
                    <span>Return to the Errl Portal</span>
                  </a>
                </div>

                {/* Center: Signature */}
                <div className="footer-column footer-column-center">
                  <div className="footer-signature">
                    Forum crafted by <span className="footer-signature-name">Chriss (Extrepa)</span>
                  </div>
                  <div className="footer-date">
                    Forum opened: <time dateTime="2026-01-01">January 2026</time>
                  </div>
                </div>

                {/* Right: Trademark & Copyright */}
                <div className="footer-column footer-column-right">
                  <div className="footer-trademark-copyright">
                    <span className="footer-trademark-name">Errl</span>
                    <span className="footer-trademark-expansion">
                      (Effervescent Remnant of Radical Luminosity/Liminality)
                    </span>
                    <span className="footer-copyright-inline">
                      • © <time dateTime="2015-05-01">2015</time> • ™ All rights reserved.
                    </span>
                  </div>
                </div>
              </div>

              {/* Tagline bar */}
              <div className="footer-tagline-bar" title={easterEgg || undefined}>
                <p className="footer-tagline">
                  {taglinePhrases.map((phrase, index) => (
                    <span key={index}>
                      <span className="footer-tagline-phrase">
                        {phrase}{phrase.endsWith('.') ? '' : '.'}
                      </span>
                      {index < taglinePhrases.length - 1 && (
                        <span className="footer-tagline-separator">•</span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            </footer>
          </div>
        </UiPrefsProvider>
      </body>
    </html>
  );
}
