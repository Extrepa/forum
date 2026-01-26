# Footer Upgrade Implementation Plan

**Branch:** `feat/responsive-footer-upgrade`  
**Date:** January 26, 2026  
**Status:** Planning

## Overview

Upgrade the footer to a responsive 3-column grid layout that collapses gracefully on mobile, with intentional tagline wrapping and proper trademark display including both "Luminosity/Liminality" variants.

## Key Requirements

### Content Requirements
1. ✅ **Portal Link** - Button-style link back to Errl Portal (https://errl.wtf)
2. ✅ **Creator Signature** - "Forum crafted by Chriss (Extrepa)"
3. ✅ **Forum Creation Date** - "Forum opened: January 2026"
4. ✅ **Trademark Info** - "Errl (Effervescent Remnant of Radical Luminosity/Liminality)"
5. ✅ **Copyright** - "© 2015 • ™ All rights reserved."
6. ✅ **Tagline** - "Keep it weird. Keep it drippy. Keep it Errl." (with intentional wrapping)

### Layout Requirements

#### Desktop (≥768px)
- **3-column grid layout**
  - **Left Column:** Portal link button + mini footer links (if applicable)
  - **Center Column:** Signature + forum creation date (center-aligned)
  - **Right Column:** Trademark + copyright (right-aligned)
- **Tagline bar:** Single line with bullet separators
- **Optional:** Tiny legal/community note line

#### Mobile (<768px)
- **Stacked single-column layout**
- All content stacks vertically
- Trademark parenthetical expansion wraps to its own line
- Tagline breaks into 3 separate lines (one per phrase)
- No horizontal overflow or awkward wrapping

## Implementation Steps

### Step 1: Update Footer HTML Structure (`src/app/layout.js`)
- [ ] Replace current footer structure (lines 44-57) with new responsive grid layout
- [ ] Add 3-column grid container with responsive classes
- [ ] Structure left column: Portal link button
- [ ] Structure center column: Signature + forum date
- [ ] Structure right column: Trademark (with both Luminosity/Liminality) + copyright
- [ ] Add tagline bar with intentional wrapping structure
- [ ] Preserve easter egg tooltip functionality

**Key Changes:**
- Convert from single flex row to CSS Grid
- Add semantic HTML structure for better accessibility
- Include both "Luminosity/Liminality" in trademark text

### Step 2: Update Footer CSS (`src/app/globals.css`)
- [ ] Update `footer` base styles (lines 1604-1612)
  - Adjust padding for new layout
  - Ensure proper max-width and centering
- [ ] Replace `.footer-line` styles (lines 1614-1626)
  - Convert to CSS Grid with `grid-template-columns: 1fr;` default
  - Add `@media (min-width: 768px)` breakpoint for 3-column layout
- [ ] Update `.footer-brand` styles (lines 1628-1637)
  - Convert to button-style appearance
  - Add border, background, padding, rounded corners
  - Improve hover states
- [ ] Add new CSS classes:
  - `.footer-grid` - Grid container
  - `.footer-column` - Column wrapper
  - `.footer-portal-link` - Portal button styling
  - `.footer-trademark` - Trademark text wrapper
  - `.footer-tagline-bar` - Tagline container with gradient background
  - `.footer-tagline-phrase` - Individual tagline phrases with responsive display
- [ ] Update `.footer-tagline` styles (lines 1643-1651)
  - Remove uppercase transform (keep natural case)
  - Add responsive wrapping behavior
  - Ensure proper spacing between phrases
- [ ] Add responsive utilities:
  - `@media (min-width: 768px)` for desktop layout
  - Mobile-first approach with `block` default, `inline` on desktop

### Step 3: Responsive Behavior Implementation
- [ ] **Grid Layout:**
  - Mobile: `display: grid; grid-template-columns: 1fr; gap: 1.5rem;`
  - Desktop: `grid-template-columns: repeat(3, 1fr);`
- [ ] **Tagline Wrapping:**
  - Mobile: Each phrase on its own line (`display: block;`)
  - Desktop: Single line with separators (`display: inline;`)
  - Use CSS to hide/show separators based on viewport
- [ ] **Trademark Wrapping:**
  - Mobile: Parenthetical expansion on separate line (`display: block;`)
  - Desktop: Inline with "Errl" (`display: inline;`)
- [ ] **Text Alignment:**
  - Mobile: All left-aligned
  - Desktop: Left, center, right per column

### Step 4: Styling Refinements
- [ ] Match existing design system colors and variables
- [ ] Portal button: Use existing accent colors, subtle border, hover effects
- [ ] Tagline bar: Gradient background, rounded corners, proper padding
- [ ] Ensure proper spacing and visual hierarchy
- [ ] Test contrast and readability

### Step 5: Testing & Verification
- [ ] **Desktop Testing (≥768px):**
  - Verify 3-column grid displays correctly
  - Check tagline stays on one line
  - Verify text alignment (left/center/right)
  - Test portal link button appearance and hover
- [ ] **Mobile Testing (<768px):**
  - Verify content stacks vertically
  - Check tagline breaks into 3 lines
  - Verify trademark wraps cleanly
  - Ensure no horizontal overflow
  - Test touch targets for links
- [ ] **Cross-browser Testing:**
  - Chrome/Edge
  - Firefox
  - Safari
- [ ] **Accessibility:**
  - Verify semantic HTML
  - Check keyboard navigation
  - Test screen reader compatibility
  - Verify color contrast

### Step 6: Content Verification
- [ ] Confirm portal URL: `https://errl.wtf`
- [ ] Verify creator name: "Chriss (Extrepa)"
- [ ] Confirm forum date: "January 2026"
- [ ] Verify trademark includes both: "Luminosity/Liminality"
- [ ] Confirm copyright year: "2015"
- [ ] Verify tagline text matches `strings.footer.tagline`

## Technical Notes

### CSS Approach
- **No Tailwind:** This project uses custom CSS, not Tailwind
- **Media Queries:** Use `@media (min-width: 768px)` for desktop breakpoint
- **Mobile-First:** Default styles for mobile, override for desktop
- **CSS Grid:** Use `display: grid` for responsive layout
- **Flexbox:** Use for internal column content alignment

### Key CSS Patterns
```css
/* Grid container */
.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .footer-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tagline wrapping */
.footer-tagline-phrase {
  display: block;
}

@media (min-width: 768px) {
  .footer-tagline-phrase {
    display: inline;
  }
}
```

### Trademark Text Format
- Display: "Errl (Effervescent Remnant of Radical Luminosity/Liminality)"
- Note: User confirmed both variants should be included with slash notation

## Files to Modify

1. **`src/app/layout.js`** (lines 44-57)
   - Replace footer HTML structure

2. **`src/app/globals.css`** (starting at line 1604)
   - Update footer styles
   - Add new responsive classes
   - Add media queries

## Dependencies

- No new dependencies required
- Uses existing CSS variables and design system
- Maintains compatibility with existing `strings.footer.tagline` and easter egg functionality

## Success Criteria

✅ Footer displays as 3-column grid on desktop  
✅ Footer stacks vertically on mobile  
✅ Tagline wraps intentionally (3 lines mobile, 1 line desktop)  
✅ Trademark text wraps cleanly  
✅ Portal link is prominent button-style element  
✅ All content is readable and accessible  
✅ No horizontal overflow on any viewport  
✅ Matches existing design system aesthetic  
✅ Both Luminosity/Liminality variants included in trademark  

## Next Steps

1. Review this plan
2. Begin implementation starting with Step 1
3. Test incrementally after each step
4. Refine styling as needed
5. Final testing and verification
6. Commit and merge when complete

---

**Keep it weird. Keep it drippy. Keep it Errl.** 🫠💧
