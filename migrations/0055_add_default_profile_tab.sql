-- Default profile tab: which section to show when visiting a profile (none | stats | activity | socials | gallery | guestbook)
ALTER TABLE users ADD COLUMN default_profile_tab VARCHAR(20) DEFAULT NULL;
