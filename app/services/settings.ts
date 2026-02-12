import { makeApiCall, settingsEndpoints } from '@/app/api/config/endpoints';

export const settingsService = {
    getSettings: async (token: string) => {
        return await makeApiCall(settingsEndpoints.get(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updateTenantSettings: async (token: string, id: string, settings: any) => {
        return await makeApiCall(settingsEndpoints.updateTenantSettings(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(settings),
        });
    },
};
