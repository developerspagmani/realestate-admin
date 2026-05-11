import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, getAuthToken, setAuthToken, removeAuthToken } from '@/app/services/api';
import { useCallback, useMemo } from 'react';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: number; // 1: user, 2: admin, 3: owner, 4: agent, 5: partner
  firstName?: string;
  lastName?: string;
  phone?: string;
  tenantId?: string;
  status?: string;
  subscriptionStatus?: number;
  subscriptionExpiresAt?: string | null;
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
  login: (credentials: { email?: string; phone?: string; password: string; tenantId?: string }) => Promise<User | null>;
  logout: () => void;
  checkAuth: () => boolean;
  clearError: () => void;
  getRedirectPath: (user?: User | null) => string;
  // Role helpers
  isAdmin: boolean;
  isOwner: boolean;
  isUser: boolean;
  isAgent: boolean;
  isPartner: boolean;
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

  const logout = useCallback((callbackUrl?: string) => {
    // Clear all auth data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('activeModules');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('mgmt_tenant_id');
      localStorage.removeItem('mgmt_owner_id');
      localStorage.removeItem('mgmt_tenant_type');
      removeAuthToken();

      // Clear cookies comprehensively
      const cookieKeys = ['auth-token', 'user-role', 'user-id', 'tenant-id'];
      const hostname = window.location.hostname;
      const domains = [hostname, `.${hostname}`];

      cookieKeys.forEach(key => {
        // Clear for each common domain and path combination
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        domains.forEach(domain => {
          document.cookie = `${key}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        });
      });
    }

    dispatch({ type: 'LOGOUT' });
    if (callbackUrl) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } else {
      router.push('/login');
    }
  }, [router, dispatch]);


  const fetchModules = async (token: string) => {
    try {
      const { moduleService } = await import('@/app/services/api');
      const response = await moduleService.getMyModules(token);
      if (response.success) {
        dispatch({ type: 'SET_MODULES', payload: response.data });
        localStorage.setItem('activeModules', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  // Initialize auth state from localStorage on mount and sync with server
  useEffect(() => {
    const initialize = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const storedToken = getAuthToken();
        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();

        // Check for idle timeout before initializing
        if (lastActivity && now - parseInt(lastActivity) > IDLE_TIMEOUT) {
          console.warn('Session expired due to inactivity.');
          logout(window.location.pathname + window.location.search);
          return;
        }

        if (storedUser && storedToken) {
          try {
            // Check if token is expired before initializing
            const parts = storedToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const tokenExp = payload.exp * 1000;
              if (tokenExp < now) {
                console.warn('Authentication token expired.');
                logout(window.location.pathname + window.location.search);
                return;
              }
            }

            // Initial load from local storage for fast state
            let user = JSON.parse(storedUser);
            const storedModules = localStorage.getItem('activeModules');
            dispatch({
              type: 'INITIALIZE',
              payload: {
                user,
                token: storedToken,
                activeModules: storedModules ? JSON.parse(storedModules) : []
              }
            });

            // Update last activity
            localStorage.setItem('lastActivity', Date.now().toString());

            // SYNC FACT: Re-fetch user profile to ensure role is up to date (e.g. if upgraded to Agent)
            try {
              const response = await authService.getMe(storedToken);
              if (response.success && response.data?.user) {
                const freshUser = response.data.user;
                // Update local storage and state if something changed (like role 1 -> 4)
                if (freshUser.role !== user.role) {
                  localStorage.setItem('user', JSON.stringify(freshUser));
                  dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: { user: freshUser, token: storedToken }
                  });
                }
              }
            } catch (_e) {
              // Silently fail sync, original state remains
            }

            // Re-fetch modules
            fetchModules(storedToken);
            return;
          } catch (error) {
            console.error('Failed to parse or validate stored auth data:', error);
            logout();
          }
        }
      }
      // If no valid session found
      dispatch({ type: 'INITIALIZE', payload: { user: null, token: null, activeModules: [] } });
    };

    initialize();
  }, [logout]);

  const login = async (credentials: { email?: string; phone?: string; password: string; tenantId?: string }): Promise<User | null> => {
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
        // FIX: Use SameSite=Lax to allow cookies during OAuth redirect flows.
        const isProd = process.env.NODE_ENV === 'production';
        const cookieOptions = `path=/; max-age=86400; SameSite=Lax${isProd ? '; Secure' : ''}`;
        document.cookie = `auth-token=${token}; ${cookieOptions}`;
        document.cookie = `user-role=${user.role}; ${cookieOptions}`;
        document.cookie = `user-id=${user.id}; ${cookieOptions}`;
        if (user.tenantId) {
          document.cookie = `tenant-id=${user.tenantId}; ${cookieOptions}`;
        }

        // Initial activity timestamp
        localStorage.setItem('lastActivity', Date.now().toString());

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });

        // Fetch and store modules after login
        fetchModules(token);

        return user;
      } else {
        const errorMessage = response.message || 'Invalid email or password';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMessage
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return null;
    }
  };


  // Advanced Idle management effect
  useEffect(() => {
    if (!state.isAuthenticated || state.loading) return;

    let timer: NodeJS.Timeout;

    const handleIdleLogout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      const now = Date.now();

      if (lastActivity) {
        const timeSinceActivity = now - parseInt(lastActivity);
        if (timeSinceActivity >= IDLE_TIMEOUT) {
          console.warn('Logging out due to inactivity');
          logout(window.location.pathname + window.location.search);
        } else {
          // Schedule next check for the remaining time
          const remainingTime = IDLE_TIMEOUT - timeSinceActivity;
          timer = setTimeout(handleIdleLogout, remainingTime);
        }
      }
    };

    const resetIdleTimer = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleIdleLogout, IDLE_TIMEOUT);
    };

    // Events to monitor for activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click'
    ];

    // Add listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Handle cross-tab activity synchronization and remote logout
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'lastActivity' && e.newValue) {
        // Activity occurred in another tab
        if (timer) clearTimeout(timer);
        const timeSinceActivity = Date.now() - parseInt(e.newValue);
        const remainingTime = IDLE_TIMEOUT - timeSinceActivity;
        if (remainingTime > 0) {
          timer = setTimeout(handleIdleLogout, remainingTime);
        } else {
          handleIdleLogout();
        }
      }

      // If 'user' is removed from another tab, log out here too
      if (e.key === 'user' && !e.newValue && state.isAuthenticated) {
        dispatch({ type: 'LOGOUT' });
        router.push('/login');
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Initial timer setup
    timer = setTimeout(handleIdleLogout, IDLE_TIMEOUT);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      window.removeEventListener('storage', handleStorageEvent);
      if (timer) clearTimeout(timer);
    };
  }, [state.isAuthenticated, state.loading, logout, router]);

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

  const getRedirectPath = (user?: User | null): string => {
    const targetUser = user || state.user;
    if (!targetUser) return '/login';

    // Ensure we handle role as a number for the switch. 
    // Handle numeric strings ('4') and named strings ('AGENT')
    let role: number;
    const rawRole = (targetUser as any).role;

    if (typeof rawRole === 'number') {
      role = rawRole;
    } else if (typeof rawRole === 'string') {
      const roleMap: Record<string, number> = {
        'USER': 1, 'ADMIN': 2, 'OWNER': 3, 'AGENT': 4, 'PARTNER': 5
      };
      const mappedRole = roleMap[rawRole.toUpperCase()];
      if (mappedRole !== undefined) {
        role = mappedRole;
      } else {
        const parsed = parseInt(rawRole, 10);
        role = isNaN(parsed) ? 1 : parsed;
      }
    } else {
      role = 1; // Default to User
    }

    switch (role) {
      case 2: // Admin
        return '/realestate-admin/dashboard';
      case 3: // Owner
        return '/realestate-owner-admin/dashboard';
      case 4: // Agent
        return '/realestate-agent/dashboard';
      case 5: // Partner
        return '/partner-dashboard';
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
    // Role helpers - matching API schema: 1=user, 2=admin, 3=owner, 4=agent, 5=partner
    isAdmin: Number(state.user?.role) === 2,    // Admin (role 2)
    isOwner: Number(state.user?.role) === 3,    // Owner (role 3)
    isUser: Number(state.user?.role) === 1,     // Regular User (role 1)
    isAgent: Number(state.user?.role) === 4,    // Agent (role 4)
    isPartner: Number(state.user?.role) === 5,  // Partner (role 5)
    hasRole: (role: number) => Number(state.user?.role) === role,
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
