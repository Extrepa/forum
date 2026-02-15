function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getAnchoredPopoverLayout({
  anchorRect,
  viewportWidth,
  viewportHeight,
  desiredWidth,
  minWidth = 160,
  edgePadding = 12,
  gap = 6,
  minHeight = 160,
  maxHeight = 380,
  panelHeight = 0,
  align = 'center',
}) {
  const resolvedWidth = clamp(
    desiredWidth,
    Math.min(minWidth, Math.max(120, viewportWidth - (edgePadding * 2))),
    Math.max(minWidth, viewportWidth - (edgePadding * 2))
  );

  let idealLeft = anchorRect.left;
  if (align === 'center') {
    idealLeft = anchorRect.left + (anchorRect.width / 2) - (resolvedWidth / 2);
  } else if (align === 'end') {
    idealLeft = anchorRect.right - resolvedWidth;
  }

  const maxLeft = Math.max(edgePadding, viewportWidth - resolvedWidth - edgePadding);
  const left = clamp(idealLeft, edgePadding, maxLeft);

  const belowTop = anchorRect.bottom + gap;
  const belowSpace = viewportHeight - belowTop - edgePadding;
  const aboveSpace = anchorRect.top - gap - edgePadding;
  const placeAbove = belowSpace < minHeight && aboveSpace > belowSpace;
  const availableHeight = placeAbove ? aboveSpace : belowSpace;
  const resolvedMaxHeight = clamp(availableHeight, 120, maxHeight);
  const measuredHeight = panelHeight > 0 ? Math.min(panelHeight, resolvedMaxHeight) : resolvedMaxHeight;
  const idealTop = placeAbove
    ? anchorRect.top - gap - measuredHeight
    : belowTop;
  const maxTop = Math.max(edgePadding, viewportHeight - measuredHeight - edgePadding);
  const top = clamp(idealTop, edgePadding, maxTop);

  return {
    left,
    top,
    width: resolvedWidth,
    maxHeight: resolvedMaxHeight,
  };
}
