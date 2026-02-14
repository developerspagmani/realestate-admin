import { makeApiCall, websiteEndpoints } from '@/app/api/config/endpoints';

export const websiteService = {
    getWebsites: async (token: string, params?: any) => {
        return await makeApiCall(websiteEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getWebsiteById: async (token: string, id: string) => {
        return await makeApiCall(websiteEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createWebsite: async (token: string, websiteData: any) => {
        return await makeApiCall(websiteEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(websiteData),
        });
    },

    updateWebsite: async (token: string, id: string, websiteData: any, tenantId?: string) => {
        return await makeApiCall(websiteEndpoints.update(id, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(websiteData),
        });
    },

    deleteWebsite: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(websiteEndpoints.delete(id, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getPublicWebsite: async (slugOrDomain: string) => {
        return await makeApiCall(websiteEndpoints.getPublic(slugOrDomain));
    },

    createPublicLead: async (id: string, leadData: any) => {
        return await makeApiCall(websiteEndpoints.createPublicLead(id), {
            method: 'POST',
            body: JSON.stringify(leadData),
        });
    },
};
