import { makeApiCall, adminEndpoints } from '@/app/api/config/endpoints';

export const workspaceService = {
    getWorkspaces: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string }) => {
        return await makeApiCall(adminEndpoints.getWorkspaces(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createWorkspace: async (token: string, workspaceData: any) => {
        return await makeApiCall(adminEndpoints.createWorkspace(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(workspaceData),
        });
    },
};
