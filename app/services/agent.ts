import { makeApiCall, agentEndpoints } from '@/app/api/config/endpoints';

export const agentService = {
    getAgents: async (token: string, params?: any) => {
        return await makeApiCall(agentEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createAgent: async (token: string, data: any) => {
        return await makeApiCall(agentEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    updateAgent: async (token: string, id: string, data: any) => {
        return await makeApiCall(agentEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    deleteAgent: async (token: string, id: string) => {
        return await makeApiCall(agentEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getCommissions: async (token: string, id: string) => {
        return await makeApiCall(agentEndpoints.getCommissions(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getMyLeads: async (token: string) => {
        return await makeApiCall(agentEndpoints.getMyLeads(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getMyCommissions: async (token: string) => {
        return await makeApiCall(agentEndpoints.getMyCommissions(), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    updateMyLeadStatus: async (token: string, id: string, status: number, notes?: string) => {
        return await makeApiCall(agentEndpoints.updateMyLeadStatus(id), {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status, notes }),
        });
    },

    // Assignment methods
    getAssignments: async (token: string, agentId: string) => {
        return await makeApiCall(agentEndpoints.getAssignments(agentId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    assignProperty: async (token: string, data: { agentId: string; propertyId: string; commissionRate?: number; isPrimary?: boolean; notes?: string }) => {
        return await makeApiCall(agentEndpoints.assignProperty(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    unassignProperty: async (token: string, assignmentId: string) => {
        return await makeApiCall(agentEndpoints.unassignProperty(assignmentId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Lead Assignment Methods
    assignLead: async (token: string, data: { agentId: string; leadId: string; isPrimary?: boolean; notes?: string }) => {
        return await makeApiCall(agentEndpoints.assignLead(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    getAgentLeads: async (token: string, agentId: string) => {
        return await makeApiCall(agentEndpoints.getLeadAssignments(agentId), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    unassignLead: async (token: string, assignmentId: string) => {
        return await makeApiCall(agentEndpoints.unassignLead(assignmentId), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
