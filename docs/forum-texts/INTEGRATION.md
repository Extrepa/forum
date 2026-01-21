# Errl Forum Text Pack — Integration Guide

> **Quick Start:** Copy strings from `ui-strings.json` or `errl-forum-texts.md` into your forum UI components.

---

## File Overview

### Core Files
- **`errl-forum-texts.md`** — Complete text library with all variations
- **`ui-strings.json`** — Structured JSON ready for code integration
- **`ui-strings.example.ts`** — TypeScript example showing how to use the JSON
- **`tone-guide.md`** — Voice and tone guidelines for consistency

### Documentation Files
- **`README.md`** — Quick overview
- **`INTEGRATION.md`** — This file (detailed integration guide)
- **`CHANGELOG.md`** — Version history and updates

---

## Integration Methods

### Method 1: Direct JSON Import (Recommended)

```typescript
// Import the JSON directly
import errlStrings from './ui-strings.json';

// Use in components
<Header>
  <Title>{errlStrings.header.title}</Title>
  <Subtitle>{errlStrings.header.subtitle}</Subtitle>
</Header>
```

### Method 2: TypeScript Constants

```typescript
// Copy from ui-strings.example.ts
export const errlForumStrings = {
  header: {
    title: "Errl Forum",
    subtitle: "Drops, devlogs, and goo-certified community chaos.",
  },
  // ... rest of strings
} as const;
```

### Method 3: Environment-Based Selection

```typescript
// Use different sets based on environment
const useLore = process.env.REACT_APP_USE_LORE === 'true';
const strings = useLore ? errlStrings.loreAlternatives : errlStrings;
```

### Method 4: Manual Copy-Paste

1. Open `errl-forum-texts.md`
2. Find the section you need
3. Copy the text that fits your context
4. Paste into your UI components

---

## Component Integration Examples

### Header Component

```tsx
import { errlForumStrings } from './strings';

function ForumHeader() {
  return (
    <header>
      <h1>{errlForumStrings.header.title}</h1>
      <p>{errlForumStrings.header.subtitle}</p>
    </header>
  );
}
```

### Category Card Component

```tsx
function CategoryCard({ category }) {
  const card = errlForumStrings.cards[category];
  const isEmpty = posts.length === 0;
  
  return (
    <div className="category-card">
      <h2>{card.title}</h2>
      <p>{card.description}</p>
      {isEmpty && <p className="empty-state">{card.empty}</p>}
    </div>
  );
}
```

### Search Component

```tsx
function SearchBar() {
  const [query, setQuery] = useState('');
  const [hasResults, setHasResults] = useState(true);
  
  return (
    <div className="search">
      <input
        placeholder={errlForumStrings.search.placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!hasResults && (
        <p className="no-results">
          {errlForumStrings.search.noResults}
        </p>
      )}
    </div>
  );
}
```

### Action Buttons

```tsx
function PostActions() {
  return (
    <div className="actions">
      <button>{errlForumStrings.actions.newPost}</button>
      <button>{errlForumStrings.actions.reply}</button>
      <button>{errlForumStrings.actions.like}</button>
    </div>
  );
}
```

---

## Dynamic Content

### User-Specific Greetings

```typescript
function getGreeting(username: string): string {
  const greetings = errlForumStrings.hero.greeting;
  // Replace "extrepa" with actual username
  return greetings.replace('extrepa', username);
}
```

### Time-Based Messages

```typescript
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Rise and drip, extrepa.";
  if (hour < 17) return "Afternoon vibes detected, extrepa.";
  if (hour < 22) return "Evening glow activated, extrepa.";
  return "3am portal hours. Errl approves.";
}
```

### Activity-Based Empty States

```typescript
function getEmptyState(category: string, activityLevel: 'high' | 'low'): string {
  const base = errlForumStrings.cards[category].empty;
  if (activityLevel === 'high') {
    return "Portal is BUZZING. Join the chaos.";
  }
  return base;
}
```

---

## Customization

### Creating Your Own Variations

1. **Start with the base set** from `ui-strings.json`
2. **Add your own variations** following the tone guide
3. **Test with real users** to see what resonates
4. **Document your additions** for consistency

### Mixing Sets

You can mix different sets for different contexts:

```typescript
const publicStrings = {
  ...errlStrings.header,
  subtitle: "Where wonder meets community.", // Lore-inspired
};

const internalStrings = {
  ...errlStrings.header,
  subtitle: "Drops, devlogs, and goo-certified community chaos.", // Standard
};
```

---

## Best Practices

### ✅ Do
- Use consistent terminology across your forum
- Test text length in your actual UI components
- Keep accessibility in mind (screen readers, etc.)
- Update strings based on user feedback
- Document any custom additions

### ❌ Don't
- Mix too many different styles in one view
- Use lore-heavy text if your audience doesn't know Errl
- Make buttons confusing (functionality > flair)
- Overuse ellipses or mystery language
- Forget to test on mobile devices

---

## Troubleshooting

### Text Too Long?
- Check `tone-guide.md` for shortening guidelines
- Use shorter variations from the library
- Consider truncation with "…" for very long text

### Not Feeling Errl Enough?
- Review `tone-guide.md` for voice guidelines
- Add more "drip/goo/portal" language
- Use lore-inspired variations if appropriate

### Need More Options?
- Check `errl-forum-texts.md` for complete library
- Create your own following the tone guide
- Consider context-aware variations

---

## Support

For questions or suggestions:
- Review `tone-guide.md` for voice consistency
- Check `errl-forum-texts.md` for more options
- Create your own variations following the established patterns

**Remember:** The goal is friendly, slightly weird, and always clear. When in doubt, default to clarity.

