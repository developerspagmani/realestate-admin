import { makeApiCall, adminEndpoints, userEndpoints } from '@/app/api/config/endpoints';

export const userService = {
    getUsers: async (token: string, params?: { page?: string; limit?: string; search?: string; role?: string; status?: string; tenantId?: string; industryType?: number | string }) => {
        return await makeApiCall(adminEndpoints.getUsers(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getUserById: async (token: string, id: string) => {
        return await makeApiCall(userEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getProfile: async (token: string) => {
        return await makeApiCall(userEndpoints.getProfile(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updateProfile: async (token: string, profileData: any) => {
        return await makeApiCall(userEndpoints.updateProfile(), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(profileData),
        });
    },

    getOwners: async (token: string, params?: { page?: string; limit?: string; search?: string; tenantId?: string; industryType?: number | string }) => {
        return await makeApiCall(adminEndpoints.getPropertyOwners(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updateUserStatus: async (token: string, userId: string, data: { status?: number; role?: number }) => {
        return await makeApiCall(adminEndpoints.updateUserStatus(userId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    createUser: async (token: string, userData: any) => {
        return await makeApiCall(userEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
    },

    updateUser: async (token: string, userId: string, userData: any) => {
        return await makeApiCall(userEndpoints.update(userId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
    },

    deleteUser: async (token: string, userId: string) => {
        return await makeApiCall(userEndpoints.delete(userId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getOwnerStats: async (token: string, id: string) => {
        return await makeApiCall(`/realestate-admin/owners/${id}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getOwnerProperties: async (token: string, id: string) => {
        return await makeApiCall(`/realestate-admin/owners/${id}/properties`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getOwnerUnits: async (token: string, id: string) => {
        return await makeApiCall(`/realestate-admin/owners/${id}/units`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getOwnerBookings: async (token: string, id: string) => {
        return await makeApiCall(`/realestate-admin/owners/${id}/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getOwnerUsers: async (token: string, id: string) => {
        return await makeApiCall(`/realestate-admin/owners/${id}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
