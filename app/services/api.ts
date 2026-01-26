import { makeApiCall, adminEndpoints, bookingEndpoints, userEndpoints, propertyEndpoints, tenantEndpoints, unitEndpoints, leadEndpoints, paymentEndpoints, settingsEndpoints, mediaEndpoints, authEndpoints, widgetEndpoints, moduleEndpoints, property3DEndpoints, discoveryEndpoints, amenityEndpoints, agentEndpoints } from '@/app/api/config/endpoints';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalProperties: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  availableWorkspaces: number;
  occupiedWorkspaces: number;
  totalOwners: number;
  totalSpaces: number;
  totalWorkspaces: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: number; // 1: user, 2: admin, 3: super admin
  status: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  unitId: string;
  startAt: string;
  endAt: string;
  status: number; // 1: pending, 2: confirmed, 3: cancelled, 4: completed, 5: no_show
  totalPrice?: number;
  paymentStatus?: number; // 1: pending, 2: paid, 3: refunded
  notes?: string;
  specialRequests?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  agentId?: string;
  agent?: any;
  unit?: any;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  propertyType: number; // 1: residential, 2: commercial, 3: industrial, 4: mixed
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  status: number; // 1: active, 2: inactive, 3: maintenance
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    units: number;
    leads: number;
    userPropertyAccess: number;
  };
  units?: any[];
  agentId?: string;
}

export interface Unit {
  id: string;
  tenantId: string;
  propertyId: string;
  unitCategory: number;
  unitCode: string;
  name?: string; // Friendly name
  unitType?: number; // Maps to unitCategory
  status: number;
  capacity?: number;
  pricePerHour?: number; // Maps from unitPricing[0].price
  createdAt: string;
  updatedAt: string;
  property?: Property;
  unitPricing?: Array<{
    price: number | string;
    currency: string;
    pricingModel: number;
  }>;
  coworkingDetails?: any;
}

export interface Tenant {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    properties: number;
    units: number;
    bookings: number;
  };
}

// Authentication service
export const authService = {
  login: async (credentials: { email?: string; phone?: string; password: string; tenantId?: string }) => {
    const { tenantId, email, phone, password } = credentials;
    return await makeApiCall(authEndpoints.login(), {
      method: 'POST',
      headers: {
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: JSON.stringify({ email, phone, password }),
    });
  },

  register: async (data: any) => {
    return await makeApiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (token: string) => {
    return await makeApiCall('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  updatePassword: async (token: string, passwordData: { currentPassword: string; newPassword: string }) => {
    return await makeApiCall('/auth/password', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(passwordData),
    });
  },

  verifyEmail: async (token: string) => {
    return await makeApiCall(authEndpoints.verifyEmail(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
  },
};

// Dashboard service
export const dashboardService = {
  getStats: async (token: string, params?: { tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(adminEndpoints.getDashboard(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Users service
export const userService = {
  getUsers: async (token: string, params?: { page?: string; limit?: string; search?: string; role?: string; status?: string; tenantId?: string; industryType?: number | string }) => {
    return await makeApiCall(adminEndpoints.getUsers(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getUserById: async (token: string, id: string) => {
    return await makeApiCall(userEndpoints.getById(id), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwners: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string; industryType?: number | string }) => {
    return await makeApiCall(adminEndpoints.getPropertyOwners(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  updateUserStatus: async (token: string, userId: string, data: { status?: number; role?: number }) => {
    return await makeApiCall(adminEndpoints.updateUserStatus(userId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  createUser: async (token: string, userData: any) => {
    return await makeApiCall(userEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (token: string, userId: string, userData: any) => {
    return await makeApiCall(userEndpoints.update(userId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (token: string, userId: string) => {
    return await makeApiCall(userEndpoints.delete(userId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwnerStats: async (token: string, id: string) => {
    return await makeApiCall(`/realestate-admin/owners/${id}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwnerProperties: async (token: string, id: string) => {
    return await makeApiCall(`/realestate-admin/owners/${id}/properties`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwnerUnits: async (token: string, id: string) => {
    return await makeApiCall(`/realestate-admin/owners/${id}/units`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwnerBookings: async (token: string, id: string) => {
    return await makeApiCall(`/realestate-admin/owners/${id}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getOwnerUsers: async (token: string, id: string) => {
    return await makeApiCall(`/realestate-admin/owners/${id}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Bookings service
export const bookingService = {
  getBookings: async (token: string, params?: { page?: string; limit?: string; status?: string; userId?: string; unitId?: string; startDate?: string; endDate?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(bookingEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getBookingById: async (token: string, bookingId: string, tenantId?: string) => {
    const params: Record<string, string> = {};
    if (tenantId) params.tenantId = tenantId;
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bookings/${bookingId}?${queryString}` : `/bookings/${bookingId}`;

    return await makeApiCall(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createBooking: async (token: string, bookingData: Partial<Booking>) => {
    return await makeApiCall('/bookings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bookingData),
    });
  },

  updateBooking: async (token: string, bookingId: string, bookingData: Partial<Booking>) => {
    return await makeApiCall(`/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bookingData),
    });
  },

  updateBookingStatus: async (token: string, bookingId: string, status: number, notes?: string) => {
    return await makeApiCall(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, notes }),
    });
  },

  cancelBooking: async (token: string, bookingId: string, reason?: string) => {
    return await makeApiCall(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
  },

  deleteBooking: async (token: string, bookingId: string) => {
    return await makeApiCall(`/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  checkAvailability: async (token: string, params: { unitId: string; startAt: string; endAt: string; bookingId?: string; tenantId?: string }) => {
    const queryString = new URLSearchParams(params as any).toString();
    return await makeApiCall(`/bookings/check-availability?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getBookingStats: async (token: string, params?: { period?: string; startDate?: string; endDate?: string; tenantId?: string; industryType?: number | string }) => {
    return await makeApiCall(bookingEndpoints.getStats(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Properties service
export const propertyService = {
  getProperties: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(propertyEndpoints.getAll(params), {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(params?.tenantId ? { 'x-tenant-domain': params.tenantId } : {})
      },
    });
  },

  getPropertyById: async (token: string, propertyId: string, tenantId?: string) => {
    return await makeApiCall(propertyEndpoints.getById(propertyId, tenantId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createProperty: async (token: string, propertyData: Partial<Property>, tenantId?: string) => {
    return await makeApiCall(propertyEndpoints.create(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: JSON.stringify({
        ...propertyData,
        ...(tenantId && !propertyData.tenantId ? { tenantId } : {})
      }),
    });
  },

  updateProperty: async (token: string, propertyId: string, propertyData: Partial<Property>, tenantId?: string) => {
    return await makeApiCall(propertyEndpoints.update(propertyId, tenantId), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: JSON.stringify(propertyData),
    });
  },

  deleteProperty: async (token: string, propertyId: string, tenantId?: string) => {
    return await makeApiCall(propertyEndpoints.delete(propertyId, tenantId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Tenants service
export const tenantService = {
  getTenants: async (token: string, params?: { type?: number | string }) => {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = queryString ? `/tenants?${queryString}` : '/tenants';
    return await makeApiCall(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getTenantById: async (token: string, tenantId: string) => {
    return await makeApiCall(`/tenants/${tenantId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createTenant: async (token: string, tenantData: Partial<Tenant>) => {
    return await makeApiCall('/tenants', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tenantData),
    });
  },

  updateTenant: async (token: string, tenantId: string, tenantData: Partial<Tenant>) => {
    return await makeApiCall(`/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tenantData),
    });
  },
};

// Units service
export const unitService = {
  getUnits: async (token: string, params?: { page?: string; limit?: string; propertyId?: string; unitCategory?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(unitEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getUnitById: async (token: string, id: string, tenantId?: string) => {
    return await makeApiCall(unitEndpoints.getById(id, tenantId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createUnit: async (token: string, unitData: any, tenantId?: string) => {
    return await makeApiCall(unitEndpoints.create(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: JSON.stringify({
        ...unitData,
        ...(tenantId && !unitData.tenantId ? { tenantId } : {})
      }),
    });
  },

  updateUnit: async (token: string, id: string, unitData: any, tenantId?: string) => {
    return await makeApiCall(unitEndpoints.update(id, tenantId), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: JSON.stringify(unitData),
    });
  },

  deleteUnit: async (token: string, id: string, tenantId?: string) => {
    return await makeApiCall(unitEndpoints.delete(id, tenantId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Workspaces service
export const workspaceService = {
  getWorkspaces: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string }) => {
    return await makeApiCall(adminEndpoints.getWorkspaces(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createWorkspace: async (token: string, workspaceData: any) => {
    return await makeApiCall(adminEndpoints.createWorkspace(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(workspaceData),
    });
  },
};

// Leads service
export const leadService = {
  getLeads: async (token: string, params?: { page?: string; limit?: string; search?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(leadEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createLead: async (token: string, leadData: any) => {
    return await makeApiCall(leadEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(leadData),
    });
  },

  updateLead: async (token: string, leadId: string, leadData: any, tenantId?: string) => {
    return await makeApiCall(leadEndpoints.update(leadId, tenantId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        ...leadData,
        ...(tenantId ? { tenantId } : {})
      }),
    });
  },

  updateLeadStatus: async (token: string, leadId: string, status: number | string, tenantId?: string, notes?: string) => {
    return await makeApiCall(leadEndpoints.updateStatus(leadId, tenantId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: Number(status), notes, tenantId }),
    });
  },

  deleteLead: async (token: string, leadId: string, tenantId?: string) => {
    return await makeApiCall(leadEndpoints.delete(leadId, tenantId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Payments service
export const paymentService = {
  getPayments: async (token: string, params?: { page?: string; limit?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
    return await makeApiCall(paymentEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createPayment: async (token: string, paymentData: any) => {
    return await makeApiCall(paymentEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(paymentData),
    });
  },
};

export const mediaService = {
  getMedia: async (token: string, params?: { tenantId?: string; ownerId?: string; industryType?: number | string;[key: string]: any }) => {
    return await makeApiCall(mediaEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getMediaStats: async (token: string) => {
    return await makeApiCall(mediaEndpoints.getStats(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getMediaById: async (token: string, id: string, tenantId?: string) => {
    return await makeApiCall(mediaEndpoints.getById(id, tenantId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createMedia: async (token: string, mediaData: FormData | any, tenantId?: string) => {
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
      },
      body: mediaData instanceof FormData ? mediaData : JSON.stringify(mediaData),
    };

    return await makeApiCall(mediaEndpoints.upload(), options);
  },

  updateMedia: async (token: string, id: string, mediaData: any, tenantId?: string) => {
    return await makeApiCall(mediaEndpoints.update(id, tenantId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(mediaData),
    });
  },

  deleteMedia: async (token: string, id: string, tenantId?: string) => {
    return await makeApiCall(mediaEndpoints.delete(id, tenantId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

export const settingsService = {
  getSettings: async (token: string) => {
    return await makeApiCall(settingsEndpoints.get(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  updateTenantSettings: async (token: string, id: string, settings: any) => {
    return await makeApiCall(settingsEndpoints.updateTenantSettings(id), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
  },
};


// Widget service
export const widgetService = {
  getWidgets: async (token: string, params?: any) => {
    return await makeApiCall(widgetEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getWidgetById: async (token: string, id: string) => {
    return await makeApiCall(widgetEndpoints.getById(id), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createWidget: async (token: string, widgetData: any) => {
    return await makeApiCall(widgetEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(widgetData),
    });
  },

  updateWidget: async (token: string, id: string, widgetData: any, tenantId?: string) => {
    return await makeApiCall(widgetEndpoints.update(id, tenantId), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(widgetData),
    });
  },

  deleteWidget: async (token: string, id: string, tenantId?: string) => {
    return await makeApiCall(widgetEndpoints.delete(id, tenantId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getPublicWidget: async (uniqueId: string) => {
    return await makeApiCall(widgetEndpoints.getPublic(uniqueId));
  },

  createPublicLead: async (uniqueId: string, leadData: any) => {
    return await makeApiCall(`${widgetEndpoints.getPublic(uniqueId)}/leads`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },
};

// Module service
export const moduleService = {
  getMyModules: async (token: string) => {
    return await makeApiCall(moduleEndpoints.getMy(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getTenantModules: async (token: string, tenantId: string) => {
    return await makeApiCall(moduleEndpoints.getTenantModules(tenantId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  toggleModule: async (token: string, data: { tenantId: string; moduleId: string; isActive: boolean }) => {
    return await makeApiCall(moduleEndpoints.toggle(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getAllModules: async (token: string) => {
    return await makeApiCall(moduleEndpoints.getAll(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Public Discovery service
export const discoveryService = {
  getProperties: async (params?: any) => {
    return await makeApiCall(discoveryEndpoints.getProperties(params));
  },
  getPropertyById: async (id: string) => {
    return await makeApiCall(discoveryEndpoints.getPropertyById(id));
  },
  getUnits: async (params?: any) => {
    return await makeApiCall(discoveryEndpoints.getUnits(params));
  },
};

// Property 3D service
export const property3DService = {
  getByPropertyId: async (token: string, propertyId: string) => {
    return await makeApiCall(property3DEndpoints.getByPropertyId(propertyId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getPublicConfig: async (propertyId: string) => {
    return await makeApiCall(`/property-3d/public/${propertyId}`);
  },

  saveConfig: async (token: string, propertyId: string, data: any) => {
    return await makeApiCall(property3DEndpoints.save(propertyId), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },
};

// Amenities service
export const amenityService = {
  getAmenities: async (token: string, params?: { category?: number | string }) => {
    return await makeApiCall(amenityEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createAmenity: async (token: string, data: any) => {
    return await makeApiCall(amenityEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateAmenity: async (token: string, id: string, data: any) => {
    return await makeApiCall(amenityEndpoints.update(id), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteAmenity: async (token: string, id: string) => {
    return await makeApiCall(amenityEndpoints.delete(id), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Agents service
export const agentService = {
  getAgents: async (token: string, params?: any) => {
    return await makeApiCall(agentEndpoints.getAll(params), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  createAgent: async (token: string, data: any) => {
    return await makeApiCall(agentEndpoints.create(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateAgent: async (token: string, id: string, data: any) => {
    return await makeApiCall(agentEndpoints.update(id), {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteAgent: async (token: string, id: string) => {
    return await makeApiCall(agentEndpoints.delete(id), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getCommissions: async (token: string, id: string) => {
    return await makeApiCall(agentEndpoints.getCommissions(id), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getMyLeads: async (token: string) => {
    return await makeApiCall(agentEndpoints.getMyLeads(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getMyCommissions: async (token: string) => {
    return await makeApiCall(agentEndpoints.getMyCommissions(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  updateMyLeadStatus: async (token: string, id: string, status: number, notes?: string) => {
    return await makeApiCall(agentEndpoints.updateMyLeadStatus(id), {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, notes }),
    });
  },

  // Assignment methods
  getAssignments: async (token: string, agentId: string) => {
    return await makeApiCall(agentEndpoints.getAssignments(agentId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  assignProperty: async (token: string, data: { agentId: string; propertyId: string; commissionRate?: number; isPrimary?: boolean; notes?: string }) => {
    return await makeApiCall(agentEndpoints.assignProperty(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  unassignProperty: async (token: string, assignmentId: string) => {
    return await makeApiCall(agentEndpoints.unassignProperty(assignmentId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  // Lead Assignment Methods
  assignLead: async (token: string, data: { agentId: string; leadId: string; isPrimary?: boolean; notes?: string }) => {
    return await makeApiCall(agentEndpoints.assignLead(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  getAgentLeads: async (token: string, agentId: string) => {
    return await makeApiCall(agentEndpoints.getLeadAssignments(agentId), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  unassignLead: async (token: string, assignmentId: string) => {
    return await makeApiCall(agentEndpoints.unassignLead(assignmentId), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

// Utility function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Utility function to set auth token
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Utility function to remove auth token
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};
