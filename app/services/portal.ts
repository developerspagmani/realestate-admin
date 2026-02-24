import { makeApiCall, portalEndpoints } from '@/app/api/config/endpoints';

export const portalService = {
    getListings: async (params?: Record<string, any>) => {
        return await makeApiCall(portalEndpoints.getListings(params));
    },

    publishListing: async (propertyId: string, portal: string) => {
        return await makeApiCall(portalEndpoints.publish(), {
            method: 'POST',
            body: JSON.stringify({ propertyId, portal })
        });
    },

    syncLeads: async (portal: string) => {
        return await makeApiCall(portalEndpoints.syncLeads(), {
            method: 'POST',
            body: JSON.stringify({ portal })
        });
    },

    updateCredentials: async (config: any) => {
        return await makeApiCall(portalEndpoints.updateCredentials(), {
            method: 'POST',
            body: JSON.stringify(config)
        });
    },

    getConnectedAccounts: async () => {
        return await makeApiCall(portalEndpoints.getConnectedAccounts());
    }
};
