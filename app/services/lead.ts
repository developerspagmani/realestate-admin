import { makeApiCall, leadEndpoints } from '@/app/api/config/endpoints';

export const leadService = {
    getLeads: async (token: string, params?: { page?: string; limit?: string; search?: string; status?: string; tenantId?: string; ownerId?: string; industryType?: number | string }) => {
        return await makeApiCall(leadEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createLead: async (token: string, leadData: any) => {
        const { userId, id, agent, property, unit, enrollments, tenant, createdAt, updatedAt, _count, ...rest } = leadData;
        return await makeApiCall(leadEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(rest),
        });
    },

    updateLead: async (token: string, leadId: string, leadData: any, tenantId?: string) => {
        const { userId, id, agent, property, unit, enrollments, tenant, createdAt, updatedAt, _count, ...rest } = leadData;
        return await makeApiCall(leadEndpoints.update(leadId, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                ...rest,
                ...(tenantId ? { tenantId } : {})
            }),
        });
    },

    updateLeadStatus: async (token: string, leadId: string, status: number | string, tenantId?: string, notes?: string) => {
        return await makeApiCall(leadEndpoints.updateStatus(leadId, tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: Number(status), notes, tenantId }),
        });
    },

    markAsLost: async (token: string, leadId: string, data: any, tenantId?: string) => {
        return await makeApiCall(leadEndpoints.markAsLost(leadId, tenantId), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deleteLead: async (token: string, leadId: string, tenantId?: string) => {
        return await makeApiCall(leadEndpoints.delete(leadId, tenantId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
