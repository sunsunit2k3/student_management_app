import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useAuthStore from '../../stores/useAuthStore';
import LoadingOverlay from '../ui/LoadingOverlay';
import type { Role } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated, isChecking, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth().catch(console.error);
    }
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    if (!isChecking) {
      if (!isAuthenticated) {
        // redirect nếu chưa login
        navigate('/signin', { state: { from: location }, replace: true });
      } else if (allowedRoles && user) {
        // redirect nếu role không phù hợp
        const hasAccess = allowedRoles.includes(user.roleName as Role);
        if (!hasAccess) {
          navigate('/not-authorized', { replace: true });
        }
      }
    }
  }, [isChecking, isAuthenticated, user, allowedRoles, navigate, location]);

  if (isChecking) return <LoadingOverlay />;
  if (isAuthenticated && user) return <>{children}</>;
  return null; // ngăn render trước khi check xong
}
