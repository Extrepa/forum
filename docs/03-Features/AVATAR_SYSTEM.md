# Avatar Integration & Customizer System

## Overview
The avatar system allows users to create, customize, and display unique avatars across the forum. It consists of a client-side SVG customizer, a standardized media utility for URL generation, and global CSS for consistent presentation.

## Features

### 1. Avatar Customizer (`AvatarCustomizer.js`)
A powerful, interactive tool for building avatars using layered SVG components.
- **Layered Editing**: Move, scale, and rotate individual pieces (Face, Eyes, Mouth, and custom imports).
- **Styling Options**: 
  - **Fill Tab**: Solid colors, Neon Glow (rainbow), and Glitter effects. Includes **Scale** and **Rotate** controls.
  - **Outline Tab**: Custom stroke colors and **Thickness** (1px to 20px) controls.
- **Color Wheel**: Click the bottom-right corner of the palette or **Right-Click** any color box to open a full color wheel and reassign colors.
- **Import Support**: Upload your own image pieces to layer onto your avatar.
- **Randomization & Reset**: 
  - **RANDOM**: Assigns random colors, finishes, and outlines to all layers.
  - **RESET**: Restores the default face shapes with a fresh set of random colors.
  - **Individual**: Double-click any layer to randomize only that piece.
- **Undo/Redo**: Large, glowing icons for a 50-step history stack.
- **Precision Controls**: Use arrow keys for fine-tuning position.
- **Centering**: The default face is perfectly centered within the canvas for better composition.

### 2. Global Username Integration (`Username.js`)
Every username link across the site automatically displays the user's avatar if they have set one.
- **Consistent Styling**: Circular shape, accent border, and subtle glow.
- **Optimized Performance**: Small 20x20 display size for lists, with `object-fit: cover` for clarity.

### 3. Media Utility (`media.js`)
Centralized logic for resolving avatar URLs.
- `getAvatarUrl(avatarKey)`: Safely constructs paths like `/api/media/avatars/{filename}`.

---

## Technical Details

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z` | Redo |
| `Arrows` | Move Selected Layer (Shift for 10px steps) |
| `[` / `]` | Scale Down / Up |
| `{` / `}` | Rotate Left / Right |
| `Backspace` / `Delete` | Delete Selected Layer |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste Layer |
| `Ctrl+D` | Duplicate Layer |

### SVG Optimization & Clipping Fixes
- **ViewBox**: `0 100 1100 1100` ensures headpieces aren't clipped and provides better vertical centering.
- **Glow Filters**: Extended filter regions (`x="-50%"`, `width="200%"`) prevent neon effects from being cut off at the edges of shapes.
- **Vector Effect**: `non-scaling-stroke` ensures outlines maintain their specified thickness regardless of the layer's scale.
- **Overflow**: The SVG uses `overflow: visible` to allow glow and effects to bleed outside the base coordinate system without clipping.

### Integration Notes
- **Database**: Avatars are stored as `avatar_key` in the `users` table.
- **API**: The `/api/media/avatars/` endpoint serves the actual image files.
- **Styling**: Use the `.username-avatar` class for any new avatar displays to ensure consistency.

---

## Troubleshooting

### Avatar not updating?
Ensure you clicked the **SAVE** button in the customizer. The system serializes the SVG state and sends it to the server.

### Piece stuck outside the box?
Use the **Undo** button or right-click to find the piece in the settings panel and reset its position using the precision controls.

### Image import looks weird?
Imported images use a default scale of 0.5. Use the **SCALE** slider in the settings panel to adjust it.
