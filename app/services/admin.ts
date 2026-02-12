import { makeApiCall, adminEndpoints } from '@/app/api/config/endpoints';

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
};
