import { isDripNomadUser } from './roles';

export const VISIBILITY_MEMBERS = 'members';
export const VISIBILITY_NOMADS = 'nomads';

export function canViewNomadContent(user) {
  return isDripNomadUser(user);
}

export function normalizeVisibilityScope(rawValue, { allowNomads = false } = {}) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (value === VISIBILITY_NOMADS && allowNomads) {
    return VISIBILITY_NOMADS;
  }
  return VISIBILITY_MEMBERS;
}

export function canViewScope(user, visibilityScope) {
  const scope = String(visibilityScope || VISIBILITY_MEMBERS).trim().toLowerCase();
  if (scope === VISIBILITY_NOMADS) {
    return canViewNomadContent(user);
  }
  return !!user;
}
