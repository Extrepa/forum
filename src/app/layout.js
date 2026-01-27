import './globals.css';
import { UiPrefsProvider } from '../components/UiPrefsProvider';
import SiteHeader from '../components/SiteHeader';
import NotificationTutorial from '../components/NotificationTutorial';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { getSessionUserWithRole, isAdminUser } from '../lib/admin';
import { getEasterEgg, getForumStrings } from '../lib/forum-texts';
import { updateUserLastSeen } from '../lib/auth';
import Username from '../components/Username';
import { getUsernameColorIndex } from '../lib/usernameColor';
import { getDb } from '../lib/db';

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

  // Get extrepa user's color preference for footer signature
  let extrepaColorIndex = null;
  try {
    const db = await getDb();
    const extrepaUser = await db
      .prepare('SELECT preferred_username_color_index FROM users WHERE username_norm = ?')
      .bind('extrepa')
      .first();
    if (extrepaUser) {
      extrepaColorIndex = extrepaUser.preferred_username_color_index;
    }
  } catch (e) {
    // Silently fail - will use automatic color
  }
  const extrepaDisplayColorIndex = getUsernameColorIndex('extrepa', { preferredColorIndex: extrepaColorIndex });

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
                    Forum crafted by Chriss (<Username name="extrepa" colorIndex={extrepaDisplayColorIndex} />)
                  </div>
                  <div className="footer-date">
                    Forum opened: <time dateTime="2026-01-01">January 2026</time>
                  </div>
                </div>

                {/* Right: Trademark & Copyright */}
                <div className="footer-column footer-column-right">
                  <div className="footer-trademark-copyright">
                    <div className="footer-trademark-line">
                      <span className="footer-trademark-name">Errl</span>
                      <span className="footer-trademark-expansion">
                        {' ('}
                        <span className="footer-expansion-word footer-expansion-word-effervescent">Effervescent</span>
                        {' '}
                        <span className="footer-expansion-word footer-expansion-word-remnant">Remnant</span>
                        {' '}
                        <span className="footer-expansion-word footer-expansion-word-of">of</span>
                        {' '}
                        <span className="footer-expansion-word footer-expansion-word-radical">Radical</span>
                        {' '}
                        <span className="footer-expansion-word footer-expansion-word-liminality">Liminality</span>
                        {')'}
                      </span>
                    </div>
                    <div className="footer-copyright-line">
                      © <time dateTime="2015-05-01">2015</time> All rights reserved.
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagline bar */}
              <div className="footer-tagline-bar" title={easterEgg || undefined}>
                <p className="footer-tagline">
                  {taglinePhrases.map((phrase, index) => {
                    const phraseText = phrase + (phrase.endsWith('.') ? '' : '.');
                    
                    // Identify special words for hover effects
                    let processedPhrase = [];
                    let currentWord = '';
                    let inWord = false;
                    
                    for (let i = 0; i < phraseText.length; i++) {
                      const char = phraseText[i];
                      const isLetter = /[a-zA-Z]/.test(char);
                      
                      if (isLetter) {
                        if (!inWord) {
                          inWord = true;
                          currentWord = char;
                        } else {
                          currentWord += char;
                        }
                      } else {
                        if (inWord) {
                          // Check if this word is special
                          const wordLower = currentWord.toLowerCase();
                          if (wordLower === 'weird') {
                            processedPhrase.push({ type: 'special-word', word: 'weird', className: 'footer-tagline-word-weird' });
                          } else if (wordLower === 'drippy') {
                            processedPhrase.push({ type: 'special-word', word: 'drippy', className: 'footer-tagline-word-drippy' });
                          } else if (wordLower === 'errl') {
                            processedPhrase.push({ type: 'special-word', word: 'Errl', className: 'footer-tagline-word-errl' });
                          } else {
                            processedPhrase.push({ type: 'normal-word', word: currentWord });
                          }
                          currentWord = '';
                          inWord = false;
                        }
                        processedPhrase.push({ type: 'char', char });
                      }
                    }
                    
                    // Handle any remaining word
                    if (inWord && currentWord) {
                      const wordLower = currentWord.toLowerCase();
                      if (wordLower === 'weird') {
                        processedPhrase.push({ type: 'special-word', word: 'weird', className: 'footer-tagline-word-weird' });
                      } else if (wordLower === 'drippy') {
                        processedPhrase.push({ type: 'special-word', word: 'drippy', className: 'footer-tagline-word-drippy' });
                      } else if (wordLower === 'errl') {
                        processedPhrase.push({ type: 'special-word', word: 'Errl', className: 'footer-tagline-word-errl' });
                      } else {
                        processedPhrase.push({ type: 'normal-word', word: currentWord });
                      }
                    }
                    
                    return (
                      <span key={index}>
                        <span className={`footer-tagline-phrase footer-tagline-phrase-${index}`}>
                          {processedPhrase.map((item, itemIndex) => {
                            if (item.type === 'special-word') {
                              // Special word - wrap each letter individually
                              const wordLetters = item.word.split('');
                              return (
                                <span key={itemIndex} className={item.className}>
                                  {wordLetters.map((letter, letterIndex) => (
                                    <span
                                      key={letterIndex}
                                      className="footer-tagline-letter footer-tagline-special-letter"
                                      style={{ '--letter-delay': `${letterIndex * 0.05}s` }}
                                    >
                                      {letter}
                                    </span>
                                  ))}
                                </span>
                              );
                            } else if (item.type === 'normal-word') {
                              // Normal word - wrap as single unit
                              return (
                                <span key={itemIndex} className="footer-tagline-normal-word">
                                  {item.word.split('').map((letter, letterIndex) => (
                                    <span
                                      key={letterIndex}
                                      className="footer-tagline-letter"
                                      style={{ '--letter-delay': `${letterIndex * 0.05}s` }}
                                    >
                                      {letter}
                                    </span>
                                  ))}
                                </span>
                              );
                            } else {
                              // Regular character (space, punctuation)
                              return (
                                <span key={itemIndex} className="footer-tagline-letter">
                                  {item.char === ' ' ? '\u00A0' : item.char}
                                </span>
                              );
                            }
                          })}
                        </span>
                        {index < taglinePhrases.length - 1 && (
                          <span className="footer-tagline-separator">•</span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            </footer>
            <ScrollToTopButton />
          </div>
        </UiPrefsProvider>
      </body>
    </html>
  );
}
