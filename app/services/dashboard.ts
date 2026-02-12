import { makeApiCall, adminEndpoints } from '@/app/api/config/endpoints';

export const dashboardService = {
    getStats: async (token: string, params?: { tenantId?: string; ownerId?: string; industryType?: number | string }) => {
        return await makeApiCall(adminEndpoints.getDashboard(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
