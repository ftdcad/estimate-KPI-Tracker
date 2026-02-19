export type UserRole = 'user' | 'manager' | 'superadmin';

export interface CurrentUser {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  firm: string;
}
