
-- 0045_add_ui_color_settings.sql

-- Add UI color preference columns to the users table
-- ui_color_mode: 0 for default/rainbow, 1 for black and white, 2 for custom neon border
-- ui_border_color: HEX color for custom neon border (e.g., '#FF34F5')
-- ui_invert_colors: 0 for normal, 1 for inverted

ALTER TABLE users ADD COLUMN ui_color_mode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN ui_border_color TEXT;
ALTER TABLE users ADD COLUMN ui_invert_colors INTEGER NOT NULL DEFAULT 0;
