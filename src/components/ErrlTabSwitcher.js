'use client';

import { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';

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
  const autoScrollRAF = useRef(null);
  const autoScrollDirection = useRef(0);
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
      const targetId = hoveredTabId ?? activeTab;
      if (!targetId) {
        setIndicatorStyle((prev) => ({
          ...prev,
          width: 0,
          left: 0,
          height: 0,
        }));
        return;
      }
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

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRAF.current) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRAF.current) return;
    const step = () => {
      const direction = autoScrollDirection.current;
      if (!direction) {
        autoScrollRAF.current = null;
        return;
      }
      const container = tabsInnerRef.current;
      if (container) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if ((direction < 0 && container.scrollLeft <= 0) || (direction > 0 && container.scrollLeft >= maxScroll)) {
          autoScrollDirection.current = 0;
          stopAutoScroll();
          return;
        }
        container.scrollLeft += direction * 1.5;
      }
      autoScrollRAF.current = requestAnimationFrame(step);
    };
    autoScrollRAF.current = requestAnimationFrame(step);
  }, [stopAutoScroll]);

  const handlePointerMove = (event) => {
    const container = tabsInnerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const threshold = 30;
    const relativeX = event.clientX - rect.left;
    const maxScroll = container.scrollWidth - container.clientWidth;
    let desiredDir = 0;
    if (relativeX < threshold && container.scrollLeft > 0) {
      desiredDir = -1;
    } else if (relativeX > rect.width - threshold && container.scrollLeft < maxScroll - 1) {
      desiredDir = 1;
    }
    if (desiredDir !== autoScrollDirection.current) {
      autoScrollDirection.current = desiredDir;
      if (desiredDir === 0) {
        stopAutoScroll();
      } else {
        startAutoScroll();
      }
    }
  };

  const handlePointerLeave = () => {
    autoScrollDirection.current = 0;
    stopAutoScroll();
  };

  const defaultLabel = (tab) => tab.label;
  const renderLabel = renderTabLabel || defaultLabel;

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return (
    <div className={`tabs-pill neon-outline-card ${className}`} role="tablist" aria-label="Errl tab switcher">
      <div
        className="tabs-pill-inner"
        ref={tabsInnerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      >
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
