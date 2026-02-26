import { makeApiCall, analyticsProEndpoints } from '@/app/api/config/endpoints';

export const analyticsProService = {
    getRevenueFunnel: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getRevenueFunnel(params));
    },
    getAgentPerformance: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getAgentPerformance(params));
    },
    getCampaignStats: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getCampaignStats(params));
    },
    getMarketingInsights: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getMarketingInsights(params));
    },
    getDemandIntelligence: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getDemandIntelligence(params));
    },
    getDealIntelligence: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getDealIntelligence(params));
    },
    getPreventionInsights: async (params?: any) => {
        return await makeApiCall(analyticsProEndpoints.getPreventionInsights(params));
    },
};
