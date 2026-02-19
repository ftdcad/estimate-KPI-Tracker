import type { CurrentUser, UserRole } from '@/types/user';
import { DEFAULT_MOCK_USER } from './mockUsers';

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  admin: 'superadmin',
  staff: 'manager',
  estimator: 'user',
};

function normalizeRole(raw: string): UserRole {
  const lower = raw.toLowerCase();
  if (LEGACY_ROLE_MAP[lower]) return LEGACY_ROLE_MAP[lower];
  if (lower === 'user' || lower === 'manager' || lower === 'superadmin') return lower;
  return 'user';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Resolve the current user from URL params.
 * Priority: ?token= (JWT) > individual URL params > dev mode mock user.
 */
export function resolveCurrentUser(): CurrentUser {
  const params = new URLSearchParams(window.location.search);

  // 1. Try JWT token
  const token = params.get('token');
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload && payload.userId && payload.role) {
      return {
        userId: String(payload.userId),
        role: normalizeRole(String(payload.role)),
        name: String(payload.name || payload.email || ''),
        email: String(payload.email || ''),
        firm: String(payload.firm || ''),
      };
    }
  }

  // 2. Try individual URL params (portal fallback)
  const role = params.get('role');
  const userId = params.get('userId') || params.get('user');
  if (role && userId) {
    return {
      userId,
      role: normalizeRole(role),
      name: params.get('userName') || params.get('name') || '',
      email: params.get('userEmail') || '',
      firm: params.get('firm') || '',
    };
  }

  // 3. Dev mode — return mock user
  return DEFAULT_MOCK_USER;
}

/** True when no token or URL params provided (running standalone) */
export function isDevMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return !params.get('token') && !params.get('role');
}

/** Returns true if the user can see all estimators (manager or superadmin) */
export function canViewAllUsers(role: UserRole): boolean {
  return role === 'manager' || role === 'superadmin';
}
