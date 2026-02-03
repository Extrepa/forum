'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const ERRL_TAB_COLOR_SEQUENCE = [
  '#34E1FF',
  '#FF34F5',
  '#FFFF00',
  '#00FF41',
  '#FF6B00',
  '#B026FF',
  '#00D9FF',
  '#CCFF00',
];

export default function ErrlTabSwitcher({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  renderTabLabel,
  getTabClassName,
  colorSequence = ERRL_TAB_COLOR_SEQUENCE,
}) {
  const tabsInnerRef = useRef(null);
  const tabButtonsRef = useRef([]);
  const [hoveredTabId, setHoveredTabId] = useState(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    top: 0,
    height: 0,
    color: colorSequence[0],
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const container = tabsInnerRef.current;

    const updateIndicator = () => {
      const targetId = hoveredTabId ?? activeTab ?? tabs[0]?.id;
      const targetIndex = tabs.findIndex((tab) => tab.id === targetId);
      const index = targetIndex >= 0 ? targetIndex : 0;
      const button = tabButtonsRef.current[index];
      if (!button || !container) {
        setIndicatorStyle((prev) => ({
          ...prev,
          width: 0,
          left: 0,
          color: colorSequence[index % colorSequence.length],
        }));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left + container.scrollLeft,
        top: buttonRect.top - containerRect.top,
        height: buttonRect.height,
        color: colorSequence[index % colorSequence.length],
      });
    };

    updateIndicator();
    const handleResize = () => window.requestAnimationFrame(updateIndicator);
    const handleScroll = () => window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', handleResize);
    container?.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, hoveredTabId, tabs, colorSequence]);

  const defaultLabel = (tab) => tab.label;
  const renderLabel = renderTabLabel || defaultLabel;

  return (
    <div className={`tabs-pill neon-outline-card ${className}`} role="tablist" aria-label="Errl tab switcher">
      <div className="tabs-pill-inner" ref={tabsInnerRef}>
        <div
          className="tabs-pill-indicator"
          style={{
            width: indicatorStyle.width,
            height: indicatorStyle.height,
            left: indicatorStyle.left,
            top: indicatorStyle.top,
            borderColor: indicatorStyle.color,
            boxShadow: `0 0 24px ${indicatorStyle.color}`,
            opacity: indicatorStyle.width ? 1 : 0,
            background: 'transparent',
          }}
          aria-hidden
        />
        {tabs.map((tab, index) => {
          const tabClass = getTabClassName ? getTabClassName(tab) : 'account-edit-tab';
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange?.(tab.id)}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              className={tabClass}
              style={{ '--tab-color': colorSequence[index % colorSequence.length] }}
              ref={(el) => { tabButtonsRef.current[index] = el; }}
            >
              {renderLabel(tab)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ERRL_TAB_COLOR_SEQUENCE };
