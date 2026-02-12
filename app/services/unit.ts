import { makeApiCall, unitEndpoints } from '@/app/api/config/endpoints';

export const unitService = {
    getUnits: async (token: string, params?: { page?: string; limit?: string; propertyId?: string; unitCategory?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
        return await makeApiCall(unitEndpoints.getAll(params), {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(params?.tenantId ? { 'x-tenant-domain': params.tenantId } : {})
            },
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
