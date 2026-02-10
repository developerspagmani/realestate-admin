import { useAuthContext, User } from '@/app/contexts/AuthContext';

/**
 * useAuth Hook
 * 
 * A convenient wrapper around AuthContext. Use this hook in components
 * to access authentication state and actions.
 */
export const useAuth = () => {
  const context = useAuthContext();

  return {
    ...context,
    // Providing explicit aliases/helpers for common properties
    user: context.user as User | null,
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,

    // Role helpers are already in context, but we ensure they are exposed
    isAdmin: context.isAdmin,
    isOwner: context.isOwner,
    isUser: context.isUser,
    isAgent: context.isAgent,

    // Actions
    login: context.login,
    logout: context.logout,
    checkAuth: context.checkAuth,
    clearError: context.clearError,
  };
};


