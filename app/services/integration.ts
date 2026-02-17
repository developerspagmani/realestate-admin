import { makeApiCall } from '@/app/api/config/endpoints';

export const integrationService = {
    getIntegrations: async (token: string) => {
        return await makeApiCall('/integrations', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    toggleStatus: async (token: string, id: string) => {
        return await makeApiCall(`/integrations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    deleteIntegration: async (token: string, id: string) => {
        return await makeApiCall(`/integrations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    connect: async (token: string, data: { siteUrl: string; siteName?: string; platform?: string; isSandbox?: boolean }) => {
        return await makeApiCall('/integrations/connect', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    }
};
