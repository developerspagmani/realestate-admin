import { makeApiCall, subscriptionEndpoints } from '@/app/api/config/endpoints';

export const subscriptionService = {
    getPlans: async () => {
        return await makeApiCall(subscriptionEndpoints.getPlans());
    },

    createPlan: async (token: string, data: any) => {
        return await makeApiCall(subscriptionEndpoints.createPlan(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    updatePlan: async (token: string, id: string, data: any) => {
        return await makeApiCall(subscriptionEndpoints.updatePlan(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deletePlan: async (token: string, id: string) => {
        return await makeApiCall(subscriptionEndpoints.deletePlan(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
