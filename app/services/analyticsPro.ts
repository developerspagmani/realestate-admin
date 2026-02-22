import { makeApiCall, analyticsProEndpoints } from '@/app/api/config/endpoints';

export const analyticsProService = {
    getRevenueFunnel: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getRevenueFunnel(params));
    },
    getAgentPerformance: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getAgentPerformance(params));
    },
    getSearchTrends: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getSearchTrends(params));
    },
    getCampaignStats: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getCampaignStats(params));
    },
};
