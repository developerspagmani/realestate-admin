import { makeApiCall } from '@/app/api/config/endpoints';
import { Tenant } from './types';

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
