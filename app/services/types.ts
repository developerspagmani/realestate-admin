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
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    propertyId?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    agentId?: string;
    agent?: any;
    unit?: any;
    property?: any;
}

export interface Property {
    id: string;
    title: string;
    description?: string;
    propertyType: number; // 1: residential, 2: commercial, 3: industrial, 4: mixed
    listingType?: string;
    price?: number | string;
    slug?: string;
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
    mainImage?: {
        url: string;
        id?: string;
    };
    _count?: {
        units: number;
        leads: number;
        userPropertyAccess: number;
    };
    units?: any[];
    agentId?: string;
    metadata?: any;
    categoryId?: string | null;
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
}

export interface Tenant {
    id: string;
    name: string;
    type: string | number;
    status: string | number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    domain?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        users: number;
        properties: number;
        units: number;
        bookings: number;
    };
    settings?: any;
}

export interface Category {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    sortOrder: number;
    status: number;
    tenantId?: string | null;
    parent?: { id: string; name: string } | null;
    _count?: { properties: number; children: number };
}

export interface Agent {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: number; // 1: user, 2: admin, 3: super admin
    status: string;
    tenantId?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        users: number;
        properties: number;
        units: number;
        bookings: number;
    };
    settings?: any;
}
