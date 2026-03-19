import { makeApiCall, popupEndpoints } from '@/app/api/config/endpoints';

export const popupService = {
    getPopups: async (token: string, params?: any) => {
        return await makeApiCall(popupEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getPopupById: async (token: string, id: string) => {
        return await makeApiCall(popupEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createPopup: async (token: string, popupData: any) => {
        return await makeApiCall(popupEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(popupData),
        });
    },

    updatePopup: async (token: string, id: string, popupData: any, tenantId?: string) => {
        return await makeApiCall(popupEndpoints.update(id, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(popupData),
        });
    },

    deletePopup: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(popupEndpoints.delete(id, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getSubmissions: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(popupEndpoints.getSubmissions(id, tenantId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getPublicPopups: async (websiteId: string) => {
        return await makeApiCall(popupEndpoints.getPublic(websiteId));
    },
};
