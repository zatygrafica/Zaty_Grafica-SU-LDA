import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import type { Profile } from '../../types/profile';
import { mapProfileToUser } from '../../services/authService';

interface Props {
  profile: Profile;
  children: React.ReactNode;
}

export const AuthSync: React.FC<Props> = ({ profile, children }) => {
  const { currentUser, login, logout, setAppStatus } = useStore();

  useEffect(() => {
    if (!profile) {
      logout();
      setAppStatus('loading');
      return;
    }
    const mappedUser = mapProfileToUser(profile);
    if (!currentUser || currentUser.id !== mappedUser.id) {
      login({
        ...mappedUser,
        role: mappedUser.role,
        permissions: mappedUser.permissions,
        isBlocked: false,
      });
    }
    setAppStatus('ready');
  }, [profile, currentUser, login, logout, setAppStatus]);

  return <>{children}</>;
};
