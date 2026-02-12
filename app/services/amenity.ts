import { makeApiCall, amenityEndpoints } from '@/app/api/config/endpoints';

export const amenityService = {
    getAmenities: async (token: string, params?: { category?: number | string }) => {
        return await makeApiCall(amenityEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createAmenity: async (token: string, data: any) => {
        return await makeApiCall(amenityEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    updateAmenity: async (token: string, id: string, data: any) => {
        return await makeApiCall(amenityEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deleteAmenity: async (token: string, id: string) => {
        return await makeApiCall(amenityEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
