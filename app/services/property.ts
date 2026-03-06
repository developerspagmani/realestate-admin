import { makeApiCall, propertyEndpoints } from '@/app/api/config/endpoints';
import { Property } from './types';

export const propertyService = {
    getProperties: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string; ownerId?: string; industryType?: number | string; categoryId?: string }) => {
        return await makeApiCall(propertyEndpoints.getAll(params), {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(params?.tenantId ? { 'x-tenant-domain': params.tenantId } : {})
            },
        });
    },

    getPropertyById: async (token: string, propertyId: string, tenantId?: string) => {
        return await makeApiCall(propertyEndpoints.getById(propertyId, tenantId), {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
            },
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
