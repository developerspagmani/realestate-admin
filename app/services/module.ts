import { makeApiCall, moduleEndpoints } from '@/app/api/config/endpoints';

export const moduleService = {
    getMyModules: async (token: string) => {
        return await makeApiCall(moduleEndpoints.getMy(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getTenantModules: async (token: string, tenantId: string) => {
        return await makeApiCall(moduleEndpoints.getTenantModules(tenantId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    toggleModule: async (token: string, data: { tenantId: string; moduleId: string; isActive: boolean }) => {
        return await makeApiCall(moduleEndpoints.toggle(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    getAllModules: async (token: string) => {
        return await makeApiCall(moduleEndpoints.getAll(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createModule: async (token: string, data: any) => {
        return await makeApiCall(moduleEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    updateModule: async (token: string, id: string, data: any) => {
        return await makeApiCall(moduleEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deleteModule: async (token: string, id: string) => {
        return await makeApiCall(moduleEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
