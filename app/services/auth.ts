import { makeApiCall, authEndpoints } from '@/app/api/config/endpoints';

export const authService = {
    login: async (credentials: { email?: string; phone?: string; password: string; tenantId?: string }) => {
        const { tenantId, email, phone, password } = credentials;
        return await makeApiCall(authEndpoints.login(), {
            method: 'POST',
            headers: {
                ...(tenantId ? { 'x-tenant-domain': tenantId } : {})
            },
            body: JSON.stringify({ email, phone, password }),
        });
    },

    register: async (data: any) => {
        return await makeApiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getMe: async (token: string) => {
        return await makeApiCall('/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updatePassword: async (token: string, passwordData: { currentPassword: string; newPassword: string }) => {
        return await makeApiCall('/auth/password', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(passwordData),
        });
    },

    verifyEmail: async (token: string) => {
        return await makeApiCall(authEndpoints.verifyEmail(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
    },

    forgotPassword: async (email: string) => {
        return await makeApiCall(authEndpoints.forgotPassword(), {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (data: any) => {
        return await makeApiCall(authEndpoints.resetPassword(), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
