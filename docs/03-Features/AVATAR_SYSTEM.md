# Avatar Integration & Customizer System

## Overview
The avatar system allows users to create, customize, and display unique avatars across the forum. It consists of a client-side SVG customizer, a standardized media utility for URL generation, and global CSS for consistent presentation.

## Features

### 1. Avatar Customizer (`AvatarCustomizer.js`)
A powerful, interactive tool for building avatars using layered SVG components.
- **Layered Editing**: Move, scale, and rotate individual pieces (Face, Eyes, Mouth, and custom imports).
- **Styling Options**: 
  - **Fill Tab**: Solid colors, Neon Glow (matching color), Glitter, and multiple **Animated Gradients** (Rainbow, Fire, Ocean, Toxic). Includes **Scale** and **Rotate** controls.
  - **Outline Tab**: Custom stroke colors and **Thickness** (1px to 10px) controls.
- **Color Wheel**: Click the bottom-right corner of the palette or **Right-Click** any color box to open a full color wheel and reassign colors.
- **Import Support**: Upload your own image pieces to layer onto your avatar.
- **Randomization & Reset**: 
  - **RANDOM**: Assigns random colors, finishes, and outlines to all layers.
  - **RESET**: Restores the default face shapes with a fresh set of random colors.
  - **Individual**: Double-click any layer or use the **RAND** button in settings to randomize only that piece.
- **Undo/Redo**: Circular icons for a **99,999-step** history stack.
- **Precision Controls**: Use arrow keys for fine-tuning position.
- **Draggable Panel**: The settings panel can be dragged anywhere on the canvas.
- **Centering**: The canvas roots from the face's mathematical center, filling the 1:1 square space perfectly.

### 2. Global Username Integration (`Username.js`)
Every username link across the site automatically displays the user's avatar if they have set one.
- **Consistent Styling**: Circular shape with a semi-transparent background for high legibility.
- **Proportional Outlines**: Strokes scale with the avatar, ensuring clarity at any size.
- **Display Size**: 24x24 display size for lists, with `object-fit: cover` for clarity.

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
| `Ctrl+S` / `Cmd+S` | Save Avatar |
| `ESC` | Close Settings Panel |
| `Arrows` | Move Selected Layer (Shift for 10px steps) |
| `[` / `]` or `+` / `-` | Scale Down / Up |
| `{` / `}` | Rotate Left / Right |
| `R` | Randomize Selected Layer |
| `Backspace` / `Delete` | Delete Selected Layer |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste Layer |
| `Ctrl+D` | Duplicate Layer |

### SVG Optimization & Centering
- **ViewBox**: `70 191 983 983` provides a tight crop around the face with 5px padding for strokes.
- **Mathematical Center**: Components scale and rotate around the center point (`561.5, 682.5`), preventing drift during transforms.
- **Glow Filters**: Extended filter regions (`x="-50%"`, `width="200%"`) prevent neon effects from being cut off at the edges.
- **Proportional Scaling**: Strokes scale naturally with layers (no `non-scaling-stroke`), keeping icons legible when shrunk.
- **Overflow**: The SVG uses `overflow: visible` to allow effects to bleed outside the base coordinate system.

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
