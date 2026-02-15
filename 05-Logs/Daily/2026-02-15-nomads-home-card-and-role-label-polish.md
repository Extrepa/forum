# 2026-02-15: Nomads Home Card + Role Label Consistency Pass

## Scope of this pass
- Added a dedicated Nomads section card on Home (`/`) for eligible users.
- Polished remaining admin/user role label displays to use `Driplet` and `Drip Nomad` consistently.

## Changes made

### 1) Dedicated Nomads card on Home
- File: `src/app/page.js`
- Added Nomads data queries to home section aggregation:
  - count query for `posts.type = 'nomads'`
  - latest post query for `posts.type = 'nomads'`
- Added `sectionData.nomads` with recent activity shape.
- Added Nomads username/color capture into username color assignment flow.
- Added a dedicated section card entry:
  - title: `Nomads`
  - description: `Private section for Drip Nomads and admins.`
  - href: `/nomads`
- Card is only added when user is eligible (`isDripNomad(user)` / admin).

### 2) Role label consistency in Admin UI
- File: `src/components/AdminConsole.js`
- Imported and used `roleDisplayLabel` for:
  - system log user role text
  - users table `Role` column
  - user drawer role display
- This aligns admin display with:
  - `Driplet`
  - `Drip Nomad`
  - `Drip Guardian`
  - `Drip Warden`

## Verification
- `npm run lint` -> passed
- `npm run build` -> passed

## Notes
- This pass is additive to the earlier Driplet/Nomads/visibility/moderation implementation.
- No migration changes were required for this pass.
