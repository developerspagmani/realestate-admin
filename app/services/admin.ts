import { makeApiCall, adminEndpoints, licenseKeyEndpoints } from '@/app/api/config/endpoints';

export const adminService = {
    getSystemSettings: async (token: string) => {
        return await makeApiCall(adminEndpoints.getSettings(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updateSystemSetting: async (token: string, key: string, value: string, type: string = 'string') => {
        return await makeApiCall(adminEndpoints.updateSetting(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ key, value, type }),
        });
    },

    extendTrial: async (token: string, tenantId: string, days: number) => {
        return await makeApiCall(adminEndpoints.extendTrial(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tenantId, days }),
        });
    },

    setExpiry: async (token: string, tenantId: string, expiresAt: string) => {
        return await makeApiCall(adminEndpoints.setExpiry(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tenantId, expiresAt }),
        });
    },

    revokeKey: async (token: string, tenantId: string) => {
        return await makeApiCall(adminEndpoints.revokeKey(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tenantId }),
        });
    },

    getTenantSubscription: async (token: string, tenantId: string) => {
        return await makeApiCall(adminEndpoints.getTenantSubscription(tenantId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    assignLicenseKey: async (token: string, data: { tenantId: string; keyId: string; expiresAt?: string }) => {
        return await makeApiCall(adminEndpoints.assignLicenseKey(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
};
