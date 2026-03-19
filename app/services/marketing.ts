import { makeApiCall, campaignEndpoints, audienceEndpoints, templateEndpoints, workflowEndpoints, formBuilderEndpoints } from '@/app/api/config/endpoints';

export const marketingService = {
    // Campaigns
    getCampaigns: async (token: string, params?: any) => {
        return await makeApiCall(campaignEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    getCampaignById: async (token: string, id: string) => {
        return await makeApiCall(campaignEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    createCampaign: async (token: string, data: any) => {
        return await makeApiCall(campaignEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    updateCampaign: async (token: string, id: string, data: any) => {
        return await makeApiCall(campaignEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    deleteCampaign: async (token: string, id: string) => {
        return await makeApiCall(campaignEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    launchCampaign: async (token: string, id: string) => {
        return await makeApiCall(campaignEndpoints.launch(id), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Audience Groups
    getAudienceGroups: async (token: string, params?: any) => {
        return await makeApiCall(audienceEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    getAudienceGroupById: async (token: string, id: string) => {
        return await makeApiCall(audienceEndpoints.getById(id), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    createAudienceGroup: async (token: string, data: any) => {
        return await makeApiCall(audienceEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    updateAudienceGroup: async (token: string, id: string, data: any) => {
        return await makeApiCall(audienceEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    deleteAudienceGroup: async (token: string, id: string) => {
        return await makeApiCall(audienceEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Content Templates
    getTemplates: async (token: string, params?: any) => {
        return await makeApiCall(templateEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    createTemplate: async (token: string, data: any) => {
        return await makeApiCall(templateEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    updateTemplate: async (token: string, id: string, data: any) => {
        return await makeApiCall(templateEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    deleteTemplate: async (token: string, id: string) => {
        return await makeApiCall(templateEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    sendTestTemplateEmail: async (token: string, data: { templateId?: string; email: string; subject?: string; content?: string }) => {
        return await makeApiCall('/marketing/templates/test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },

    // Workflows
    getWorkflows: async (token: string, params?: any) => {
        return await makeApiCall(workflowEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    createWorkflow: async (token: string, data: any) => {
        return await makeApiCall(workflowEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    updateWorkflow: async (token: string, id: string, data: any) => {
        return await makeApiCall(workflowEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    toggleWorkflow: async (token: string, id: string) => {
        return await makeApiCall(workflowEndpoints.toggle(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    deleteWorkflow: async (token: string, id: string) => {
        return await makeApiCall(workflowEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Form Builder
    getForms: async (token: string, params?: any) => {
        return await makeApiCall(formBuilderEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    createForm: async (token: string, data: any) => {
        return await makeApiCall(formBuilderEndpoints.create(), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    updateForm: async (token: string, id: string, data: any) => {
        return await makeApiCall(formBuilderEndpoints.update(id), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    deleteForm: async (token: string, id: string) => {
        return await makeApiCall(formBuilderEndpoints.delete(id), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getMarketingStats: async (token: string, params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return await makeApiCall(`/marketing/stats${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Interaction Tracking
    trackInteraction: async (data: { leadId?: string, email?: string, visitorId?: string, type: string, metadata?: any }) => {
        return await makeApiCall('/public/track', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getLeadInteractions: async (token: string, leadId: string) => {
        return await makeApiCall(`/marketing/interactions/${leadId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    // Workflow Execution
    processWorkflows: async (token: string) => {
        return await makeApiCall('/marketing/workflows/process', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getWorkflowEnrollments: async (token: string, workflowId: string) => {
        return await makeApiCall(`/marketing/workflows/${workflowId}/enrollments`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getWorkflowEnrollmentLogs: async (token: string, enrollmentId: string) => {
        return await makeApiCall(`/marketing/workflows/enrollments/${enrollmentId}/logs`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getRecommendations: async (token: string, leadId: string) => {
        return await makeApiCall(`/marketing/recommendations/${leadId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    sendRecommendations: async (token: string, leadId: string) => {
        return await makeApiCall(`/marketing/recommendations/${leadId}/send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
    testWorkflow: async (token: string, workflow: any, testLead: any) => {
        return await makeApiCall('/marketing/workflows/test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ workflow, testLead }),
        });
    },

    // Intelligent Email Automation
    getIntelligentConfig: async (token: string, tenantId: string) => {
        return await makeApiCall(`/marketing/intelligent/config?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    saveIntelligentConfig: async (token: string, tenantId: string, config: any) => {
        return await makeApiCall(`/marketing/intelligent/config?tenantId=${tenantId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(config),
        });
    },

    getIntelligentLogs: async (token: string, tenantId: string) => {
        return await makeApiCall(`/marketing/intelligent/logs?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getIntelligentStats: async (token: string, tenantId: string) => {
        return await makeApiCall(`/marketing/intelligent/stats?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getLeadSegments: async (token: string, tenantId: string) => {
        return await makeApiCall(`/marketing/intelligent/segments?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getIntelligentHeatmap: async (token: string, tenantId: string) => {
        return await makeApiCall(`/marketing/intelligent/heatmap?tenantId=${tenantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    testIntelligentEmail: async (token: string, tenantId: string, data: { email: string, budget: number }) => {
        return await makeApiCall(`/marketing/intelligent/test?tenantId=${tenantId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
    },
    
    getEmailSettings: async (token: string, params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return await makeApiCall(`/marketing/settings/email${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    saveEmailSettings: async (token: string, config: any, params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return await makeApiCall(`/marketing/settings/email${query}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(config),
        });
    },
};
