import { makeApiCall, discoveryEndpoints } from '@/app/api/config/endpoints';

export const discoveryService = {
    getProperties: async (params?: any) => {
        return await makeApiCall(discoveryEndpoints.getProperties(params));
    },
    getPropertyById: async (id: string) => {
        return await makeApiCall(discoveryEndpoints.getPropertyById(id));
    },
    getUnits: async (params?: any) => {
        return await makeApiCall(discoveryEndpoints.getUnits(params));
    },
};
