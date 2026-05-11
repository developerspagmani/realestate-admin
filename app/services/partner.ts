import { makeApiCall, partnerEndpoints } from '@/app/api/config/endpoints';

export const partnerService = {
    getProfile: async () => {
        return await makeApiCall(partnerEndpoints.getProfile());
    },

    updateProfile: async (data: any) => {
        return await makeApiCall(partnerEndpoints.getProfile(), {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    register: async (data: any) => {
        return await makeApiCall(partnerEndpoints.register(), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    adminList: async (params?: Record<string, any>) => {
        return await makeApiCall(partnerEndpoints.adminList(params));
    },

    adminUpdate: async (id: string, data: { status?: number; partnerType?: string }) => {
        return await makeApiCall(partnerEndpoints.adminUpdate(id), {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    addClient: async (data: any) => {
        return await makeApiCall(partnerEndpoints.addClient(), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    adminGetById: async (id: string) => {
        return await makeApiCall(`/partners/admin/${id}`);
    },

    adminSendConfirmation: async (id: string) => {
        return await makeApiCall(`/partners/admin/${id}/send-confirmation`, {
            method: 'POST'
        });
    },
};
