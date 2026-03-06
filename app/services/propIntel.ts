import { makeApiCall, propIntelEndpoints } from '@/app/api/config/endpoints';

export const propIntelService = {
    /**
     * Identifies why properties have no enquiry, are not buying, or are seen but not decided.
     */
    getPerformanceDiagnostics: async (params?: any) => {
        return await makeApiCall(propIntelEndpoints.getDiagnostics(params));
    },

    /**
     * Prepares the Product Market Fit report for low-attention properties.
     */
    getPMFAnalysis: async (params?: any) => {
        return await makeApiCall(propIntelEndpoints.getPMFAnalysis(params));
    },

    /**
     * Generates intelligent suggestions for price, specifications, and content.
     */
    getSuggestions: async (params?: any) => {
        return await makeApiCall(propIntelEndpoints.getSuggestions(params));
    }
};
