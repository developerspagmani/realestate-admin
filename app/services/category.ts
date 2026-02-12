import { makeApiCall, categoryEndpoints } from '@/app/api/config/endpoints';

export const categoryService = {
    getCategories: async (token: string, params?: Record<string, any>) => {
        return await makeApiCall(categoryEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getCategoryById: async (token: string, id: string) => {
        return await makeApiCall(categoryEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createCategory: async (token: string, data: any) => {
        return await makeApiCall(categoryEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    updateCategory: async (token: string, id: string, data: any) => {
        return await makeApiCall(categoryEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deleteCategory: async (token: string, id: string) => {
        return await makeApiCall(categoryEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
