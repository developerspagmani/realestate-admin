import { makeApiCall, cmsEndpoints } from '@/app/api/config/endpoints';

export interface Page {
    id: string;
    tenantId?: string;
    title: string;
    slug: string;
    content?: string;
    featureImageId?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status: number;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    featureImage?: any;
}

export const cmsService = {
    getPages: async (token: string, tenantId?: string) => {
        return await makeApiCall(cmsEndpoints.getAll({ tenantId }), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getPageById: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(cmsEndpoints.getById(id, tenantId), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    createPage: async (token: string, data: Partial<Page>) => {
        return await makeApiCall(cmsEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    },

    updatePage: async (token: string, id: string, data: Partial<Page>, tenantId?: string) => {
        return await makeApiCall(cmsEndpoints.update(id, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    },

    deletePage: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(cmsEndpoints.delete(id, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getPublicPage: async (slug: string) => {
        return await makeApiCall(cmsEndpoints.getPublic(slug));
    }
};

export default cmsService;
