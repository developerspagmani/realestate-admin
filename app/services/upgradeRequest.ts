import { makeApiCall, upgradeRequestEndpoints } from '@/app/api/config/endpoints';

export const upgradeRequestService = {
    submitRequest: async (data: { requestedPlanId: string; email: string; message?: string }) => {
        return await makeApiCall(upgradeRequestEndpoints.submit(), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAllRequests: async () => {
        return await makeApiCall(upgradeRequestEndpoints.getAll());
    },

    updateStatus: async (id: string, status: number) => {
        return await makeApiCall(upgradeRequestEndpoints.updateStatus(id), {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },
};
