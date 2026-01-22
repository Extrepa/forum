# Project Documentation Organization

This document describes the organization of all project development documentation within the `docs/` directory.

## Directory Structure

### `docs/01-Implementation/`
Implementation reviews, summaries, and status documents covering the development lifecycle.
- Implementation reviews and summaries
- Completion notes
- Status updates
- System reviews

### `docs/02-Deployment/`
Deployment-related documentation including notes, checklists, and build fixes.
- Deployment notes and procedures
- Pre-deployment checklists
- Build fixes
- Deployment readiness documents

### `docs/03-Features/`
Feature-specific implementation notes and updates.
- Header and navigation updates
- Search functionality
- Layout changes (threads, replies, timezone)
- Mobile fixes
- Database query fixes
- Feature-specific reviews

### `docs/04-Migrations/`
Database migration documentation and status tracking.
- Migration status documents
- Migration fixes
- Migration completion notes

### `docs/06-Verification/`
Verification checklists, notes, and testing documentation.
- Verification checklists
- Implementation verification notes
- Feature verification documents
- Migration and build verification

### `docs/07-Planning/`
Future planning and roadmap documents.
- Next phase plans
- Feature roadmaps

### `docs/08-Reference/`
Reference materials and external resources.
- Feature lists from external sources
- Upgrade notes and issues

### `docs/forum-texts/`
UI strings and forum text documentation.
- Integration guides
- Tone guides
- String definitions

### Technical Documentation
- **`docs/Guide.md`** - Build and deployment guide (technical reference)
- **`docs/Errl-Forum_GitHub-Cloudflare-Workflow.md`** - GitHub and Cloudflare deployment workflow
- **`docs/Development-Workflow.md`** - Development workflow documentation
- **`docs/GitHub-Setup.md`** - GitHub setup guide
- **`docs/Quick-Reference.md`** - Quick reference guide
- **`docs/Workflow-Rules.md`** - Workflow rules

### `05-Logs/` (at root level)
Daily development logs and notes organized by date.
- `Daily/` - Daily development notes and logs
- `Development/` - Development-specific documentation
- Kept at root level for easy access during active development

## Quick Reference

- **Looking for implementation details?** → `docs/01-Implementation/`
- **Need deployment info?** → `docs/02-Deployment/`
- **Feature-specific notes?** → `docs/03-Features/`
- **Database migrations?** → `docs/04-Migrations/`
- **Daily logs?** → `05-Logs/Daily/` (at root)
- **Verification docs?** → `docs/06-Verification/`
- **Future plans?** → `docs/07-Planning/`
- **Reference materials?** → `docs/08-Reference/`
- **Build/deployment guide?** → `docs/Guide.md`
- **UI strings documentation?** → `docs/forum-texts/`

## Notes

- All project documentation is consolidated in the `docs/` directory
- `05-Logs/` remains at root level for easy access during active development
- Technical build documentation is in `docs/` alongside project documentation
- No files were deleted, only moved and organized
- The main `README.md` remains in the root for project overview
