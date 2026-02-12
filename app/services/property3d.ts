import { makeApiCall, property3DEndpoints } from '@/app/api/config/endpoints';

export const property3DService = {
    getByPropertyId: async (token: string, propertyId: string) => {
        return await makeApiCall(property3DEndpoints.getByPropertyId(propertyId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getPublicConfig: async (propertyId: string) => {
        return await makeApiCall(`/property-3d/public/${propertyId}`);
    },

    saveConfig: async (token: string, propertyId: string, data: any) => {
        return await makeApiCall(property3DEndpoints.save(propertyId), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
};
