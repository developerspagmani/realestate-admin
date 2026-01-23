import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, getAuthToken, setAuthToken, removeAuthToken } from '@/app/services/api';

// Types
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

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  activeModules: string[];
}

export interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string; tenantId?: string }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  clearError: () => void;
  getRedirectPath: () => string;
  // Role helpers
  isAdmin: boolean;
  isOwner: boolean;
  isUser: boolean;
  hasRole: (role: number) => boolean;
  // Tenant helper
  tenantId?: string;
  // Module helper
  hasModule: (moduleSlug: string) => boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE'; payload: { user: User | null; token: string | null; activeModules?: string[] } }
  | { type: 'SET_MODULES'; payload: string[] };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // Start as true to wait for initialization
  error: null,
  activeModules: [],
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        activeModules: action.payload.activeModules || [],
        loading: false,
      };
    case 'SET_MODULES':
      return {
        ...state,
        activeModules: action.payload,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const fetchModules = async (token: string) => {
    try {
      const { moduleService } = await import('@/app/services/api');
      const response = await moduleService.getMyModules(token);
      if (response.success) {
        dispatch({ type: 'SET_MODULES', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initialize = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const storedToken = getAuthToken();

        if (storedUser && storedToken) {
          try {
            const user = JSON.parse(storedUser);
            const storedModules = localStorage.getItem('activeModules');
            dispatch({
              type: 'INITIALIZE',
              payload: {
                user,
                token: storedToken,
                activeModules: storedModules ? JSON.parse(storedModules) : []
              }
            });
            // Re-fetch to ensure fresh data
            fetchModules(storedToken);
            return;
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
            localStorage.removeItem('user');
            removeAuthToken();
          }
        }
      }
      // If no valid session found
      dispatch({ type: 'INITIALIZE', payload: { user: null, token: null, activeModules: [] } });
    };

    initialize();
  }, []);

  const login = async (credentials: { email: string; password: string; tenantId?: string }): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Store token for API calls
        setAuthToken(token);

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Set cookies for middleware
        const cookieOptions = 'path=/; max-age=86400; SameSite=Strict';
        document.cookie = `auth-token=${token}; ${cookieOptions}`;
        document.cookie = `user-role=${user.role}; ${cookieOptions}`;
        document.cookie = `user-id=${user.id}; ${cookieOptions}`;
        if (user.tenantId) {
          document.cookie = `tenant-id=${user.tenantId}; ${cookieOptions}`;
        }

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });

        // Fetch and store modules after login
        fetchModules(token);

        return true;
      } else {
        const errorMessage = response.message || 'Invalid email or password';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMessage
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return false;
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('user');
    removeAuthToken();

    // Clear cookies
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'tenant-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  const checkAuth = (): boolean => {
    const token = getAuthToken();
    const user = localStorage.getItem('user');

    if (!token || !user) {
      logout();
      return false;
    }

    try {
      JSON.parse(user); // Validate user data
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getRedirectPath = (): string => {
    if (!state.user) return '/login';

    switch (state.user.role) {
      case 2: // Admin
        return '/realestate-admin/dashboard';
      case 3: // Owner
        return '/realestate-owner-admin/dashboard';
      case 1: // Regular User
      default:
        return '/user/dashboard';
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
    clearError,
    getRedirectPath,
    // Role helpers - matching API schema: 1=user, 2=admin, 3=owner
    isAdmin: state.user?.role === 2,    // Admin (role 2)
    isOwner: state.user?.role === 3,    // Owner (role 3)
    isUser: state.user?.role === 1,     // Regular User (role 1)
    hasRole: (role: number) => state.user?.role === role,
    // Tenant helper
    tenantId: state.user?.tenantId,
    // Module helper
    hasModule: (slug: string) => (state.user?.role === 2) || state.activeModules.includes(slug),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
