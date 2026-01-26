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

  // Update user's last_seen timestamp to track active browsing
  // Do this asynchronously so it doesn't block page rendering
  if (user?.id) {
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
        </UiPrefsProvider>
      </body>
    </html>
  );
}
