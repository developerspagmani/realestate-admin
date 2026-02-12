import { makeApiCall, paymentEndpoints } from '@/app/api/config/endpoints';

export const paymentService = {
    getPayments: async (token: string, params?: { page?: string; limit?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
        return await makeApiCall(paymentEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createPayment: async (token: string, paymentData: any) => {
        return await makeApiCall(paymentEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(paymentData),
        });
    },
};
