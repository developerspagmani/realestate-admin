import { makeApiCall, licenseKeyEndpoints } from '@/app/api/config/endpoints';

export const licenseKeyService = {
    getAll: async (token: string, params?: any) => {
        return await makeApiCall(licenseKeyEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    generate: async (token: string, data: { planId: string; count: number }) => {
        return await makeApiCall(licenseKeyEndpoints.generate(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    validate: async (key: string, planId?: string) => {
        return await makeApiCall(licenseKeyEndpoints.validate(), {
            method: 'POST',
            body: JSON.stringify({ key, planId }),
        });
    },

    activate: async (token: string, key: string) => {
        return await makeApiCall(licenseKeyEndpoints.activate(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ key }),
        });
    },
};
