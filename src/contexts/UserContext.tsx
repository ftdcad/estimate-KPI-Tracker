import React, { createContext, useContext, useState } from 'react';
import type { CurrentUser } from '@/types/user';
import { resolveCurrentUser, isDevMode } from '@/lib/auth';
import { MOCK_USERS } from '@/lib/mockUsers';

const UserContext = createContext<{
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
} | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(resolveCurrentUser);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {isDevMode() && <DevRoleSwitcher currentUser={currentUser} onSwitch={setCurrentUser} />}
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUser {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within <UserProvider>');
  return ctx.currentUser;
}

function DevRoleSwitcher({
  currentUser,
  onSwitch,
}: {
  currentUser: CurrentUser;
  onSwitch: (user: CurrentUser) => void;
}) {
  return (
    <div className="bg-yellow-900/50 border-b border-yellow-700 px-4 py-1.5 text-sm flex items-center gap-3 flex-wrap">
      <span className="font-medium text-yellow-300">
        Dev Mode: {currentUser.name} ({currentUser.role})
      </span>
      <div className="flex gap-1.5">
        {MOCK_USERS.map((user) => (
          <button
            key={user.userId}
            onClick={() => onSwitch(user)}
            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
              currentUser.userId === user.userId
                ? 'bg-yellow-600 text-white border-yellow-500'
                : 'bg-muted text-yellow-300 border-yellow-700 hover:bg-yellow-900/50'
            }`}
          >
            {user.name} ({user.role})
          </button>
        ))}
      </div>
    </div>
  );
}
