'use client';

import { useEffect, useState } from 'react';
import HomeSectionCard from './HomeSectionCard';

const MOBILE_BREAKPOINT = 640;

export default function HomeSectionsList({ sections, usernameColorMap }) {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedHref, setExpandedHref] = useState(null);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && expandedHref !== null) {
      setExpandedHref(null);
    }
  }, [isMobile, expandedHref]);

  return (
    <div className="list grid-tiles home-sections-list">
      {sections.map((section) => (
        <HomeSectionCard
          key={section.href}
          title={section.title}
          description={section.description}
          count={section.count}
          recentActivities={section.recentActivities}
          recentActivity={section.recentActivity}
          href={section.href}
          usernameColorMap={usernameColorMap}
          compactMode={isMobile}
          isExpanded={expandedHref === section.href}
          onToggle={() => {
            setExpandedHref((current) => (current === section.href ? null : section.href));
          }}
        />
      ))}
    </div>
  );
}
