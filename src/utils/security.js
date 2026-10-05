export const VALID_ROLES = ['ADMIN', 'COORDINATOR'];

export function sanitizeText(value, fallback = '') {
  if (value == null) return fallback;
  const cleaned = String(value).replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return cleaned || fallback;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}

export function normalizeRole(role) {
  const normalized = sanitizeText(role, '').toUpperCase();
  return VALID_ROLES.includes(normalized) ? normalized : null;
}

export function safeJsonParse(value, fallback = null) {
  if (value == null || value === '') return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function readSafeStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
}

export function buildSessionGuard(session) {
  if (!session || typeof session !== 'object') return null;

  const token = sanitizeText(session.token || session.access_token || '', '');
  if (!token) return null;

  const profile = session.profile && typeof session.profile === 'object' ? session.profile : {};
  const role = normalizeRole(profile.role);

  return {
    token,
    profile: {
      ...profile,
      role: role || 'COORDINATOR',
      active: profile.active !== false,
      email: sanitizeText(profile.email || '', ''),
      name: sanitizeText(profile.name || '', ''),
    },
  };
}
