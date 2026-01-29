'use client';

import { useEffect, useState } from 'react';

export default function NotificationTutorial({ isSignedIn }) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;

    // Check if tutorial has been seen
    const hasSeenTutorial = localStorage.getItem('errl_notification_tutorial_seen') === 'true';
    
    if (!hasSeenTutorial) {
      // Show tutorial after a short delay to let page load
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  const handleDismiss = () => {
    localStorage.setItem('errl_notification_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  if (!showTutorial) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={handleDismiss}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="section-title" style={{ marginTop: 0 }}>Welcome to Errl Forum!</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <p style={{ color: 'var(--muted)' }}>
            Here&apos;s how to get the most out of your experience:
          </p>
          <div>
            <strong style={{ color: 'var(--accent)' }}>🔔 Notifications</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--muted)' }}>
              Click the Errl logo in the header to see your notifications. You&apos;ll get notified when someone replies to your threads or mentions you.
            </p>
          </div>
          <div>
            <strong style={{ color: 'var(--accent)' }}>👤 Your Account</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--muted)' }}>
              Click your username anywhere on the site to view your profile. Visit the Account page to manage your settings and preferences.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="button"
          style={{ width: '100%' }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
