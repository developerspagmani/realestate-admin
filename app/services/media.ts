import { makeApiCall, mediaEndpoints } from '@/app/api/config/endpoints';

export const mediaService = {
    getMedia: async (token: string, params?: { tenantId?: string; ownerId?: string; industryType?: number | string;[key: string]: any }) => {
        return await makeApiCall(mediaEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getMediaStats: async (token: string) => {
        return await makeApiCall(mediaEndpoints.getStats(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getMediaById: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(mediaEndpoints.getById(id, tenantId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createMedia: async (token: string, mediaData: FormData | any, tenantId?: string) => {
        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
            },
            body: mediaData instanceof FormData ? mediaData : JSON.stringify(mediaData),
        };

        return await makeApiCall(mediaEndpoints.upload(), options);
    },

    updateMedia: async (token: string, id: string, mediaData: any, tenantId?: string) => {
        return await makeApiCall(mediaEndpoints.update(id, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(mediaData),
        });
    },

    deleteMedia: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(mediaEndpoints.delete(id, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
