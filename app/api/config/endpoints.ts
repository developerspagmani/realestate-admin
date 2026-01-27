// Base API URL for Next.js API Routes (Proxy)
const API_BASE_URL = '/api';

/**
 * Helper function to make API calls to the Next.js API Routes (Proxy).
 * Note: Each endpoint here corresponds to a folder in app/api/*
 */
export async function makeApiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {};

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Automatically include tenant domain from cookie if present as a default
  if (typeof document !== 'undefined') {
    const tenantIdAttr = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant-id='))
      ?.split('=')[1];

    if (tenantIdAttr) {
      headers['x-tenant-domain'] = tenantIdAttr;
    }

    let authTokenAttr = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    // Fallback to localStorage if cookie is missing
    if (!authTokenAttr && typeof window !== 'undefined') {
      authTokenAttr = localStorage.getItem('authToken') || undefined;
    }

    const isPublicRoute = endpoint.startsWith('/public') || endpoint.includes('/public/');

    if (authTokenAttr && !isPublicRoute) {
      headers['Authorization'] = `Bearer ${authTokenAttr}`;
    }
  }

  // Merge headers from options, allowing them to override defaults
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers[key] = String(value);
    });
  }

  // Extract non-header options to pass to fetch
  const { headers: _optionsHeaders, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors && Array.isArray(error.errors)
        ? `${error.message}: ${error.errors.join(', ')}`
        : (error.message || `HTTP error! status: ${response.status}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Auth endpoints - Matches app/api/auth/[[...path]]
export const authEndpoints = {
  register: () => '/auth/register',
  login: () => '/auth/login',
  getMe: () => '/auth/me',
  updatePassword: () => '/auth/password',
  verifyEmail: () => '/auth/verify-email',
  forgotPassword: () => '/auth/forgot-password',
  resetPassword: () => '/auth/reset-password',
};

// User endpoints - Matches app/api/users/[[...path]]
export const userEndpoints = {
  getProfile: () => '/users/profile',
  updateProfile: () => '/users/profile',
  getBookings: () => '/users/bookings',
  getReviews: () => '/users/reviews',
  getNotifications: () => '/users/notifications',
  markNotificationRead: (id: string) => `/users/notifications/${id}/read`,
  deleteAccount: () => '/users/account',
  // Management
  getAll: (params?: Record<string, any>) =>
    params ? `/users?${buildQueryString(params)}` : '/users',
  create: () => '/users',
  getById: (id: string, tenantId?: string) =>
    `/users/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  update: (id: string, tenantId?: string) =>
    `/users/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) =>
    `/users/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
};

// Booking endpoints - Matches app/api/bookings/[[...path]]
export const bookingEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/bookings?${buildQueryString(params)}` : '/bookings',
  getById: (id: string, tenantId?: string) =>
    `/bookings/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  getUserBookings: () => '/bookings/my',
  create: () => '/bookings',
  update: (id: string, tenantId?: string) =>
    `/bookings/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  updateStatus: (id: string, tenantId?: string) =>
    `/bookings/${id}/status${tenantId ? `?tenantId=${tenantId}` : ''}`,
  cancel: (id: string, tenantId?: string) =>
    `/bookings/${id}/cancel${tenantId ? `?tenantId=${tenantId}` : ''}`,
  getStats: (params?: Record<string, any>) =>
    params ? `/bookings/stats?${buildQueryString(params)}` : '/bookings/stats',
};

// Administrative / Management Modules
export const adminEndpoints = {
  getDashboard: (params?: Record<string, any>) =>
    params ? `/realestate-admin/dashboard?${buildQueryString(params)}` : '/realestate-admin/dashboard',
  getUsers: (params?: Record<string, any>) =>
    params ? `/users?${buildQueryString(params)}` : '/users',
  updateUserStatus: (id: string) => `/users/${id}`,
  getPropertyOwners: (params?: Record<string, any>) => {
    const allParams = { ...params, role: '3' };
    return `/users?${buildQueryString(allParams)}`;
  },
  getProperties: (params?: Record<string, any>) =>
    params ? `/realestate-admin/properties?${buildQueryString(params)}` : '/realestate-admin/properties',
  getWorkspaces: (params?: Record<string, any>) =>
    params ? `/realestate-admin/workspace?${buildQueryString(params)}` : '/realestate-admin/workspace',
  createWorkspace: () => '/realestate-admin/workspace',
  getAnalytics: (params?: Record<string, any>) =>
    params ? `/realestate-admin/analytics?${buildQueryString(params)}` : '/realestate-admin/analytics',
};

// Public Discovery Modules
export const workspaceEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/workspaces?${buildQueryString(params)}` : '/workspaces',
  getById: (id: string) => `/workspaces/${id}`,
  getAvailability: (id: string, params?: Record<string, any>) =>
    params ? `/workspaces/${id}/availability?${buildQueryString(params)}` : `/workspaces/${id}/availability`,
};

export const propertyEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/properties?${buildQueryString(params)}` : '/properties',
  getById: (id: string, tenantId?: string) =>
    `/properties/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  create: () => '/properties',
  update: (id: string, tenantId?: string) =>
    `/properties/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) =>
    `/properties/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
};

// Tenant endpoints
export const tenantEndpoints = {
  getAll: () => '/tenants',
  getById: (id: string) => `/tenants/${id}`,
  create: () => '/tenants',
  update: (id: string) => `/tenants/${id}`,
  delete: (id: string) => `/tenants/${id}`,
};

// Unit endpoints
export const unitEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/units?${buildQueryString(params)}` : '/units',
  getById: (id: string, tenantId?: string) =>
    `/units/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  create: () => '/units',
  update: (id: string, tenantId?: string) =>
    `/units/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) =>
    `/units/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
};

// Lead endpoints
export const leadEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/leads?${buildQueryString(params)}` : '/leads',
  getById: (id: string) => `/leads/${id}`,
  getStats: () => '/leads/stats',
  create: () => '/leads',
  update: (id: string, tenantId?: string) =>
    `/leads/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  updateStatus: (id: string, tenantId?: string) =>
    `/leads/${id}/status${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) =>
    `/leads/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
};

// Payment endpoints
export const paymentEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/payments?${buildQueryString(params)}` : '/payments',
  getById: (id: string) => `/payments/${id}`,
  getUserPayments: () => '/payments/my',
  getStats: () => '/payments/stats',
  create: () => '/payments',
  refund: (id: string) => `/payments/${id}/refund`,
};

// Campaign endpoints
export const campaignEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/campaigns?${buildQueryString(params)}` : '/campaigns',
  getStats: () => '/campaigns/stats',
  getById: (id: string) => `/campaigns/${id}`,
  create: () => '/campaigns',
  update: (id: string) => `/campaigns/${id}`,
  delete: (id: string) => `/campaigns/${id}`,
  launch: (id: string) => `/campaigns/${id}/launch`,
};

// Media endpoints
export const mediaEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/media?${buildQueryString(params)}` : '/media',
  getStats: () => '/media/stats',
  getById: (id: string, tenantId?: string) =>
    `/media/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  upload: () => '/media',
  update: (id: string, tenantId?: string) =>
    `/media/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) =>
    `/media/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
};

// Social Posts endpoints
export const socialPostEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/social-posts?${buildQueryString(params)}` : '/social-posts',
  getStats: () => '/social-posts/stats',
  getById: (id: string) => `/social-posts/${id}`,
  create: () => '/social-posts',
  update: (id: string) => `/social-posts/${id}`,
  delete: (id: string) => `/social-posts/${id}`,
  publish: (id: string) => `/social-posts/${id}/publish`,
};

// Settings endpoints
export const settingsEndpoints = {
  get: () => '/tenants',
  updateTenantSettings: (id: string) => `/tenants/${id}`,
};

// Widget endpoints
export const widgetEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/widgets?${buildQueryString(params)}` : '/widgets',
  getById: (id: string, tenantId?: string) => `/widgets/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  create: () => '/widgets',
  update: (id: string, tenantId?: string) => `/widgets/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  delete: (id: string, tenantId?: string) => `/widgets/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`,
  getPublic: (uniqueId: string) => `/widgets/public/${uniqueId}`,
};

// Public Discovery endpoints (No auth required)
export const discoveryEndpoints = {
  getProperties: (params?: Record<string, any>) =>
    params ? `/public/properties?${buildQueryString(params)}` : '/public/properties',
  getPropertyById: (id: string) => `/public/properties/${id}`,
  getUnits: (params?: Record<string, any>) =>
    params ? `/public/units?${buildQueryString(params)}` : '/public/units',
};

// Module endpoints
export const moduleEndpoints = {
  getMy: () => '/modules/my',
  getAll: () => '/modules/all',
  create: () => '/modules',
  getTenantModules: (tenantId: string) => `/modules/tenant/${tenantId}`,
  toggle: () => '/modules/toggle',
};

// Amenity endpoints
export const amenityEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/amenities?${buildQueryString(params)}` : '/amenities',
  create: () => '/amenities',
  update: (id: string) => `/amenities/${id}`,
  delete: (id: string) => `/amenities/${id}`,
};

// Agent endpoints
export const agentEndpoints = {
  getAll: (params?: Record<string, any>) =>
    params ? `/agents?${buildQueryString(params)}` : '/agents',
  create: () => '/agents',
  update: (id: string) => `/agents/${id}`,
  delete: (id: string) => `/agents/${id}`,
  getCommissions: (id: string) => `/agents/${id}/commissions`,
  // Assignments
  assignProperty: () => '/agents/assignments',
  getAssignments: (id: string) => `/agents/${id}/assignments`,
  unassignProperty: (id: string) => `/agents/assignments/${id}`,
  // Lead Assignments
  assignLead: () => '/agents/lead-assignments',
  getLeadAssignments: (id: string) => `/agents/${id}/lead-assignments`,
  unassignLead: (id: string) => `/agents/lead-assignments/${id}`,
  // Agent Dashboard (Role 4)
  getMyProfile: () => '/agents/my/profile',
  getMyLeads: () => '/agents/my/leads',
  getMyCommissions: () => '/agents/my/commissions',
  updateMyLeadStatus: (id: string) => `/agents/my/leads/${id}/status`,
};

// Property 3D endpoints
export const property3DEndpoints = {
  getByPropertyId: (propertyId: string) => `/property-3d/${propertyId}`,
  save: (propertyId: string) => `/property-3d/${propertyId}`,
};

// Helper function to build query strings
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};
