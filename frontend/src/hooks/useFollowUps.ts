import { useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FollowUpsContext } from '../context/FollowUpsContextValue';

export function useFollowUps() {
  const context = useContext(FollowUpsContext);
  const { user } = useAuth();
  if (!context) throw new Error('useFollowUps must be used within a FollowUpsProvider.');
  const { ensureLoaded } = context;
  useEffect(() => {
    if (user?.id) void ensureLoaded(user.id).catch(() => {});
  }, [ensureLoaded, user?.id]);
  return context;
}
