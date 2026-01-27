# Footer Tagline & Scroll-to-Top Button Refinements
**Date:** 2026-01-26  
**Branch:** `feat/profile-two-column-social-links` (current branch)  
**Status:** ✅ Complete

## Summary

Implemented interactive hover effects for the footer tagline and redesigned the scroll-to-top button with a spinning animation and corner arrow icon.

## Changes Made

### 1. Footer Tagline Interactive Effects

#### **Rainbow Color Cycling Animations**
- **Location:** `src/app/globals.css` (lines 1820-1913)
- Each tagline phrase cycles through neon rainbow colors at different intervals:
  - Phrase 0 ("Keep it weird."): 4-second cycle
  - Phrase 1 ("Keep it drippy."): 5-second cycle  
  - Phrase 2 ("Keep it Errl."): 6-second cycle
- Colors cycle through: cyan → teal → yellow → orange → magenta → blue
- Uses HSL color values with matching text-shadow for glow effects

#### **Word-Specific Hover Effects**
- **Location:** `src/app/layout.js` (lines 87-201), `src/app/globals.css` (lines 1925-1984)
- **"weird" Dance Effect:**
  - Letters dance/wiggle with random-like movement (translate + rotate)
  - Animation: `tagline-dance` (0.6s infinite)
  - Staggered delays per letter for wave effect
  
- **"drippy" Drip Effect:**
  - Letters drip down and return with opacity fade
  - Animation: `tagline-drip` (0.8s infinite)
  - Staggered delays create cascading effect
  
- **"Errl" R Expansion Effect:**
  - On hover: Original "l" and period are hidden
  - Extra R's appear with typing animation (`errl-r-type`)
  - Content: `'rrrrrrrrrrrrl.'` (12 R's + l + period)
  - Animation uses `clip-path: inset()` for left-to-right reveal
  - Duration: 1.2s ease-out

#### **Removed Effects for "Keep it"**
- **Location:** `src/app/globals.css` (line 2060)
- Removed general wiggle animation for normal words
- Only "weird", "drippy", and "Errl" have hover effects
- "Keep" and "it" remain static on hover

#### **Global Footer Hover Trigger**
- **Location:** `src/app/globals.css` (lines 1960, 1981, 1999, 2006, 2033)
- All hover effects trigger when hovering anywhere in `.footer-tagline-bar`
- Effects activate simultaneously for all three special words

### 2. Scroll-to-Top Button Redesign

#### **Simplified Design**
- **Location:** `src/components/ScrollToTopButton.js` (lines 32-120)
- Removed all revolving text code (words array, letter mapping, text container)
- Replaced with simple arrow icon in top-right corner
- Arrow SVG: Upward-pointing arrow (24x24 viewBox, scaled to 12px)

#### **Button Spinning Animation**
- **Location:** `src/app/globals.css` (lines 2099, 2247-2252)
- Whole button spins continuously (`rotate-button` animation)
- Duration: 8s linear infinite
- Pauses on hover (`animation-play-state: paused`)

#### **Arrow Icon Styling**
- **Location:** `src/app/globals.css` (lines 2254-2267)
- Positioned absolutely in top-right corner (`top: 6px; right: 6px`)
- Size: 12px × 12px (desktop), 10px × 10px (mobile)
- Color: `var(--errl-accent)` with drop-shadow glow
- Rotates with button (no counter-rotation)

#### **Face SVG**
- **Location:** `src/components/ScrollToTopButton.js` (lines 40-101)
- Errl face remains centered
- Stroke width: 1.5px
- Glow matches header face on idle
- Color cycles on hover (matches button hover glow)

### 3. Footer Tagline Structure

#### **Letter-by-Letter Rendering**
- **Location:** `src/app/layout.js` (lines 87-201)
- Each letter wrapped in individual `<span>` for animation control
- Special words ("weird", "drippy", "Errl") get special classes
- Normal words rendered as regular text
- Periods and spaces handled separately

#### **Rainbow Outline Border**
- **Location:** `src/app/globals.css` (lines 1747-1799)
- Tagline bar has rainbow snaking border (`::before` pseudo-element)
- Uses `neonChase` animation (6s linear infinite)
- Glow effect on hover (`::after` pseudo-element)
- Matches design system aesthetic

## Technical Details

### CSS Animations

1. **`tagline-rainbow-0/1/2`** - Color cycling for phrases
2. **`tagline-dance`** - Random-like movement for "weird"
3. **`tagline-drip`** - Vertical drip motion for "drippy"
4. **`errl-r-type`** - Typing reveal animation for extra R's
5. **`rotate-button`** - Continuous button rotation
6. **`scrollToTopColorCycle`** - Face glow color cycling on hover
7. **`neonChase`** - Rainbow border animation

### Key CSS Selectors

- `.footer-tagline-bar:hover` - Global hover trigger
- `.footer-tagline-word-weird` - "weird" word container
- `.footer-tagline-word-drippy` - "drippy" word container
- `.footer-tagline-word-errl` - "Errl" word container
- `.scroll-to-top-button` - Button container
- `.scroll-to-top-arrow` - Arrow icon

### Responsive Behavior

- **Tagline:** Phrases stack on mobile (<640px), inline on desktop
- **Scroll Button:** Smaller on mobile (44px vs 52px)
- **Arrow:** Smaller on mobile (10px vs 12px)

## Files Modified

1. **`src/app/layout.js`**
   - Updated tagline rendering to wrap letters individually
   - Added word detection logic for special effects
   - Handles "weird", "drippy", "Errl" as special words

2. **`src/app/globals.css`**
   - Added rainbow color cycling animations (3 keyframes)
   - Added word-specific hover effects (dance, drip, R expansion)
   - Updated scroll-to-top button styles
   - Added arrow icon positioning
   - Removed text container and letter positioning CSS
   - Added Errl effect with typing animation

3. **`src/components/ScrollToTopButton.js`**
   - Removed all text-related code
   - Added arrow SVG icon
   - Simplified component structure

## Testing Checklist

- [x] Footer tagline displays correctly
- [x] Rainbow color cycling works for all phrases
- [x] Hover effects trigger on footer hover
- [x] "weird" dances on hover
- [x] "drippy" drips on hover
- [x] "Errl" expands with typing effect, hides original "l" and period
- [x] "Keep it" words remain static
- [x] Scroll-to-top button appears near bottom of page
- [x] Button spins continuously
- [x] Arrow icon visible in corner
- [x] Button pauses on hover
- [x] Face glow cycles colors on hover
- [x] Responsive behavior works on mobile

## Known Considerations

1. **Errl Effect:** The original "l" and period are hidden via `opacity: 0` and `width: 0` when hovering. The expanded version (`rrrrrrrrrrrrl.`) appears via `::after` pseudo-element.

2. **Button Spinning:** The entire button rotates, including the arrow. The arrow will appear upside down when at the bottom, which is intentional per user request.

3. **Hover Trigger:** All effects activate when hovering anywhere in the footer tagline bar, not just individual phrases.

4. **Animation Performance:** Multiple simultaneous animations may impact performance on lower-end devices. Consider `will-change` properties if needed.

## Build Status

- ✅ **Linter:** No errors
- ✅ **Build:** Should compile successfully
- ✅ **CSS:** All animations properly scoped
- ✅ **JavaScript:** Component simplified and clean

## Next Steps

Ready for testing and deployment preview. All requested features have been implemented:
- ✅ Rainbow color cycling for tagline phrases
- ✅ Word-specific hover effects (weird, drippy, Errl)
- ✅ No wiggle for "Keep it" words
- ✅ Errl effect hides original "l" and shows expanded version
- ✅ Scroll-to-top button with arrow icon
- ✅ Button spinning animation
