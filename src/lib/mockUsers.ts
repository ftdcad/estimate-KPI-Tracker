import type { CurrentUser } from '@/types/user';

export const MOCK_USERS: CurrentUser[] = [
  { userId: 'frank', role: 'superadmin', name: 'Frank Dalton', email: 'frank@coastalclaims.net', firm: 'Coastal Claims Services' },
  { userId: 'sarah', role: 'manager', name: 'Sarah Manager', email: 'sarah@coastalclaims.net', firm: 'Coastal Claims Services' },
  { userId: 'nell', role: 'user', name: 'Nell Dalton', email: 'nell@coastalclaims.net', firm: 'Coastal Claims Services' },
  { userId: 'brandon', role: 'user', name: 'Brandon Leighton', email: 'brandon@coastalclaims.net', firm: 'Coastal Claims Services' },
];

export const DEFAULT_MOCK_USER: CurrentUser = MOCK_USERS[0]; // Frank (superadmin)

/** Display names for the estimator picker (user-role people only) */
export const ESTIMATOR_NAMES = MOCK_USERS
  .filter((u) => u.role === 'user')
  .map((u) => u.name);
