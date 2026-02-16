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

/** Roles a sender can message. Driplets: only other Driplets. Nomads: Driplets + Nomads. Mods: up to Mods. Admins: all. */
const MESSAGEABLE_ROLES = {
  [ROLE_DRIPLET]: [ROLE_DRIPLET],
  [ROLE_DRIP_NOMAD]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD],
  [ROLE_MOD]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD, ROLE_MOD],
  [ROLE_ADMIN]: [ROLE_DRIPLET, ROLE_DRIP_NOMAD, ROLE_MOD, ROLE_ADMIN],
};

export function canMessageByRole(senderRole, recipientRole) {
  const allowed = MESSAGEABLE_ROLES[senderRole];
  if (!allowed) return false;
  return allowed.includes(recipientRole || ROLE_DRIPLET);
}
