# Header Height Fix - 2026-01-26

**Date:** 2026-01-26  
**Issue:** Header height increases unnecessarily when viewport shrinks and title/description wrap

## Problem

When the viewport shrinks, the header's title ("Errl Forum") and description ("Pulled together by chance and light.") wrap to multiple lines, causing the header to grow taller. The user wants the header to maintain a consistent height even when text wraps.

## Root Cause

The header is a flex container with `flex-direction: column` and `gap: 12px`. When text wraps:
1. The `.brand` section grows taller to accommodate wrapped text
2. The header grows taller to accommodate the taller brand section
3. No constraints prevent this growth

## Solution

Applied multiple CSS changes to prevent unnecessary height growth:

### 1. Tighter Line Heights
- Set `line-height: 1.2` on `.brand-left h1` (title)
- Set `line-height: 1.3` on `.brand-left p` (description)
- Applied to both default and mobile breakpoints

### 2. Reduced Spacing on Mobile
- Reduced `.brand-left` gap from `4px` to `2px` on mobile viewports
- Reduced `.brand-left` padding-right from `96px` to `80px` on mobile

### 3. Brand Section Constraints
- Added `align-self: flex-start` to `.brand-left` to prevent unnecessary expansion
- Added `flex-shrink: 0` to `.brand` to prevent compression

### 4. Header Alignment
- Added `align-items: stretch` to `header` to ensure consistent alignment

## Files Modified

- `src/app/globals.css`
  - Updated `.brand-left` styles (lines ~410-419)
  - Updated `.brand-left h1` styles (lines ~421-429)
  - Updated `.brand-left p` styles (lines ~431-438)
  - Updated `.brand` styles (lines ~377-385)
  - Updated `header` styles (lines ~59-73)
  - Updated mobile media query `.brand-left` styles (lines ~3013-3016)
  - Updated mobile media query `.brand h1` and `.brand p` styles (lines ~3075-3084)

## Testing

- [ ] Test on wide viewport - header should be compact
- [ ] Test on medium viewport - header should maintain height when text wraps
- [ ] Test on narrow viewport - header should not grow unnecessarily tall
- [ ] Verify title and description still wrap correctly
- [ ] Verify no visual regressions on other pages

## Notes

- Line heights are now tighter to reduce vertical space when text wraps
- Spacing is reduced on mobile to minimize height growth
- Brand section is constrained to prevent unnecessary expansion
- Header maintains consistent height across viewport sizes
