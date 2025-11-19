import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useAuthStore from '../../stores/useAuthStore';
import LoadingOverlay from '../ui/LoadingOverlay';

interface Props {
  children: React.ReactNode;
  allowedRoles?: String;
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated, isChecking, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    if (!isChecking) {
      if (!isAuthenticated) {
        navigate('/signin', { state: { from: location }, replace: true });
      } else if (allowedRoles && user) {
        const hasAccess = user.roleName 
          ? allowedRoles.includes(user.roleName) 
          : false;

        if (!hasAccess) {
          navigate('/not-authorized', { replace: true });
        }
      }
    }
  }, [isChecking, isAuthenticated, user, allowedRoles, navigate, location]);

  if (isChecking) return <LoadingOverlay />;

  if (isAuthenticated && user) return <>{children}</>;

  return null;
}