export const ROLE_DRIPLET = 'user';
export const ROLE_DRIP_NOMAD = 'drip_nomad';
export const ROLE_MOD = 'mod';
export const ROLE_ADMIN = 'admin';

export function isAdminUser(user) {
  return !!user && user.role === ROLE_ADMIN;
}

export function isModeratorUser(user) {
  return !!user && (user.role === ROLE_MOD || user.role === ROLE_ADMIN);
}

export function isDripNomadUser(user) {
  return !!user && (user.role === ROLE_DRIP_NOMAD || user.role === ROLE_ADMIN);
}

export function roleDisplayLabel(role) {
  if (role === ROLE_ADMIN) return 'Drip Warden';
  if (role === ROLE_MOD) return 'Drip Guardian';
  if (role === ROLE_DRIP_NOMAD) return 'Drip Nomad';
  return 'Driplet';
}
