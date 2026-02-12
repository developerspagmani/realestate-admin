import { makeApiCall, widgetEndpoints } from '@/app/api/config/endpoints';

export const widgetService = {
    getWidgets: async (token: string, params?: any) => {
        return await makeApiCall(widgetEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getWidgetById: async (token: string, id: string) => {
        return await makeApiCall(widgetEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createWidget: async (token: string, widgetData: any) => {
        return await makeApiCall(widgetEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(widgetData),
        });
    },

    updateWidget: async (token: string, id: string, widgetData: any, tenantId?: string) => {
        return await makeApiCall(widgetEndpoints.update(id, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(widgetData),
        });
    },

    deleteWidget: async (token: string, id: string, tenantId?: string) => {
        return await makeApiCall(widgetEndpoints.delete(id, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getPublicWidget: async (uniqueId: string) => {
        return await makeApiCall(widgetEndpoints.getPublic(uniqueId));
    },

    createPublicLead: async (uniqueId: string, leadData: any) => {
        return await makeApiCall(`${widgetEndpoints.getPublic(uniqueId)}/leads`, {
            method: 'POST',
            body: JSON.stringify(leadData),
        });
    },

    getPublicForm: async (formId: string) => {
        return await makeApiCall(`/public/forms/${formId}`);
    },
};
