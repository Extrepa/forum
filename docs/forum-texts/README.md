# Errl Forum Text Pack

> **Ready-to-go Errl-themed text and microcopy for your forum UI**

A comprehensive collection of Errl-branded text strings, variations, and guidelines to give your forum that perfect "friendly + slightly weird" vibe. Everything you need to make your forum feel authentically Errl.

---

## 📦 What's Inside

### Core Files
- **`errl-forum-texts.md`** — Complete text library with all variations, options, and creative flair
- **`ui-strings.json`** — Structured JSON ready for direct code integration
- **`ui-strings.example.ts`** — TypeScript example showing usage patterns
- **`tone-guide.md`** — Voice and tone guidelines for consistency

### Documentation
- **`README.md`** — This file (overview and quick start)
- **`INTEGRATION.md`** — Detailed integration guide with code examples
- **`CHANGELOG.md`** — Version history and updates

---

## 🚀 Quick Start

### Option 1: Copy-Paste (Fastest)
1. Open `errl-forum-texts.md`
2. Find the text you need
3. Copy and paste into your UI

### Option 2: JSON Import (Recommended)
```typescript
import errlStrings from './ui-strings.json';

// Use in components
<h1>{errlStrings.header.title}</h1>
<p>{errlStrings.header.subtitle}</p>
```

### Option 3: TypeScript Constants
```typescript
import { errlForumStrings } from './ui-strings.example';

// Use throughout your app
<button>{errlForumStrings.actions.newPost}</button>
```

**👉 See `INTEGRATION.md` for detailed examples and best practices.**

---

## 📋 What's Included

### Text Categories
- ✅ Header titles and subtitles
- ✅ Hero greetings (with time-based variations)
- ✅ Category cards (title, description, empty states)
- ✅ Search UI copy
- ✅ Button and action labels
- ✅ Footer taglines
- ✅ Easter egg messages
- ✅ Lore-inspired variations (Nomads, Portal Keepers, Realms)

### Variations Available
- **Standard set** — Friendly, accessible, broadly appealing
- **Lore-inspired** — Deep Errl universe references (for dedicated fans)
- **Creative variations** — Time-based, mood-based, context-aware
- **User role labels** — Portal Keeper, Nomad, Rhythm-Walker, etc.

---

## 🎨 Tone & Voice

**Core vibe:** Friendly + slightly weird  
**Style:** Casual cosmic / portal energy  
**Approach:** Short lines, clean phrasing, funny but not try-hard

**Key principles:**
- Empathy first, always
- Permanent wonder
- Harmonious connection
- Creative chaos (but friendly)

**👉 See `tone-guide.md` for complete guidelines.**

---

## 📁 File Structure

```
Errl-Forum-Text-Pack/
├── errl-forum-texts.md      # Complete text library
├── ui-strings.json           # Structured JSON for code
├── ui-strings.example.ts     # TypeScript example
├── tone-guide.md             # Voice & tone guidelines
├── README.md                 # This file
├── INTEGRATION.md            # Integration guide
└── CHANGELOG.md              # Version history
```

---

## 💡 Usage Tips

### Start Simple
Use the **"Recommended Best Fit Set"** from `errl-forum-texts.md` for initial implementation.

### Add Personality
Swap in creative variations based on:
- Time of day (morning/evening greetings)
- User context (new vs. returning)
- Activity level (high vs. low traffic)
- Community depth (standard vs. lore-heavy)

### Mix and Match
- **Public-facing:** Use subtle themed set
- **Internal/community:** Use chaotic themed set
- **Dedicated fans:** Use lore-inspired variations
- **Context-aware:** Use creative variations

---

## 🎯 Recommended Placement

### For Your Project Structure

**Option A: Standalone Package** (Recommended)
```
your-project/
└── packages/
    └── errl-forum-texts/
        ├── src/
        │   ├── strings.ts          # Main export
        │   └── variations.ts       # Additional options
        ├── errl-forum-texts.md     # Reference library
        ├── tone-guide.md           # Guidelines
        └── README.md
```

**Option B: Direct Integration**
```
your-project/
└── src/
    ├── components/
    │   └── forum/
    │       └── strings.ts          # Copy from ui-strings.json
    └── docs/
        └── errl-forum-texts.md     # Reference copy
```

**Option C: Documentation Folder**
```
your-project/
└── docs/
    └── content/
        └── errl-forum-texts/       # Entire pack here
```

---

## 🔧 Customization

### Creating Your Own Variations
1. Start with the base set from `ui-strings.json`
2. Follow guidelines in `tone-guide.md`
3. Test with real users
4. Document your additions

### Mixing Different Sets
You can use different text sets for different contexts:
- Public pages: Standard set
- Community areas: Lore-inspired
- Admin panels: Simple, clear
- Easter eggs: Maximum creativity

---

## ✅ Best Practices

### Do
- ✅ Use consistent terminology across your forum
- ✅ Test text length in actual UI components
- ✅ Keep accessibility in mind
- ✅ Update based on user feedback
- ✅ Document custom additions

### Don't
- ❌ Mix too many styles in one view
- ❌ Use lore-heavy text for general audiences
- ❌ Make buttons confusing (functionality > flair)
- ❌ Overuse ellipses or mystery language
- ❌ Forget mobile testing

---

## 📚 Documentation

- **`INTEGRATION.md`** — Detailed integration guide with code examples
- **`tone-guide.md`** — Voice and tone consistency guidelines
- **`errl-forum-texts.md`** — Complete text library reference
- **`CHANGELOG.md`** — Version history and updates

---

## 🤝 Contributing

Found a better way to phrase something? Have ideas for new variations?

1. Review `tone-guide.md` for consistency
2. Test your additions in context
3. Document your changes
4. Share with the community

---

## 📝 License & Usage

This text pack is designed for use in Errl-related projects and community spaces. Feel free to:
- Use in your Errl forum/community projects
- Modify for your specific needs
- Share improvements with the community
- Keep the Errl spirit alive

---

## 🌟 Credits

**Created for:** Errl Universe  
**Inspired by:** ErrlVault lore and community  
**Voice:** Friendly + slightly weird + empathy-first

---

**KEEP IT WEIRD. KEEP IT REAL. KEEP IT ERRL.**

---

## Quick Links

- 📖 [Integration Guide](./INTEGRATION.md)
- 🎨 [Tone Guide](./tone-guide.md)
- 📝 [Complete Text Library](./errl-forum-texts.md)
- 📋 [Changelog](./CHANGELOG.md)

