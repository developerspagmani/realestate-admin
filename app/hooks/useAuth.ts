import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch, loginStart, loginSuccess, loginFailure, logout } from '@/store';
import { authService, getAuthToken, setAuthToken, removeAuthToken } from '@/app/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: number; // 1: user, 2: admin/owner, 3: super admin
  tenantId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authState = useAppSelector((state: any) => state.auth);

  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedToken = getAuthToken();

      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser);
          dispatch(loginSuccess(user));
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('user');
          removeAuthToken();
        }
      }
    }
  }, [dispatch]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setError(null);
    dispatch(loginStart());

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Store token for API calls
        setAuthToken(token);

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Set cookies for middleware with proper security
        const cookieOptions = 'path=/; max-age=86400; SameSite=Strict; Secure';
        document.cookie = `auth-token=${token}; ${cookieOptions}`;
        document.cookie = `user-role=${user.role}; ${cookieOptions}`;
        document.cookie = `user-id=${user.id}; ${cookieOptions}`;
        if (user.tenantId) {
          document.cookie = `tenant-id=${user.tenantId}; ${cookieOptions}`;
        }

        dispatch(loginSuccess(user));
        return true;
      } else {
        const errorMessage = response.message || 'Invalid email or password';
        setError(errorMessage);
        dispatch(loginFailure(errorMessage));
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
      return false;
    } finally {
      // Loading state is managed by Redux
    }
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem('user');
    removeAuthToken();

    // Clear cookies
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'tenant-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    dispatch(logout());
    router.push('/login');
  }, [dispatch, router]);

  const updateUserProfile = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // This would call user profile update API
      // const response = await userService.updateProfile(token, userData);

      // For now, just update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch(loginSuccess(updatedUser));

      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }, [dispatch]);

  const checkAuth = useCallback((): boolean => {
    const token = getAuthToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
      logoutUser();
      return false;
    }

    try {
      JSON.parse(user); // Validate user data
      return true;
    } catch {
      logoutUser();
      return false;
    }
  }, [logoutUser]);

  const getRedirectPath = useCallback((user: User): string => {
    switch (user.role) {
      case 2: // Admin
        return '/realestate-admin/dashboard';
      case 3: // Owner
        return '/realestate-owner-admin/dashboard';
      case 1: // Regular User
        return '/user/dashboard';
      default:
        return '/dashboard';
    }
  }, []);

  return {
    // State
    user: authState.user,
    token: getAuthToken(),
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: error || authState.error,

    // Actions
    login,
    logout: logoutUser,
    updateProfile: updateUserProfile,
    checkAuth,

    // Utilities
    getRedirectPath,

    // Role helpers - matching API schema: 1=user, 2=admin, 3=owner
    isAdmin: authState.user?.role === 2,    // Admin (role 2)
    isOwner: authState.user?.role === 3,    // Owner (role 3)
    isUser: authState.user?.role === 1,     // Regular User (role 1)
    hasRole: (role: number) => authState.user?.role === role,

    // Tenant helper
    tenantId: authState.user?.tenantId,
  };
};
