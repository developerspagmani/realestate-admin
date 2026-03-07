// Social Media API Client for realestate-admin

const API_BASE_URL = '/api';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
    return { 'Content-Type': 'application/json' };
};

// Connected Accounts API
export const connectedAccountsApi = {
    // Get all connected accounts
    getAll: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/accounts?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get account by ID
    getById: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/${id}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get account by platform
    getByPlatform: async (platform: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/platform/${platform}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Connect new account
    connect: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/connect`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Disconnect account
    disconnect: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Refresh token
    refreshToken: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/${id}/refresh`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get connection stats
    getStats: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/stats`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Exchange Meta OAuth code
    exchangeMetaCode: async (code: string, redirectUri?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/meta/exchange`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code, redirectUri })
        });
        return response.json();
    },

    // Exchange Google OAuth code
    exchangeGoogleCode: async (code: string, redirectUri?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/accounts/google/exchange`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code, redirectUri })
        });
        return response.json();
    }
};

// Scheduled Posts API
export const scheduledPostsApi = {
    // Get all scheduled posts
    getAll: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get drafts
    getDrafts: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/drafts?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get by ID
    getById: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/${id}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Create scheduled post
    create: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Create draft
    createDraft: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/drafts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Update post
    update: async (id: string, data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Delete post
    delete: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Publish now
    publishNow: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/${id}/publish`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get stats
    getStats: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/stats`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get by property
    getByProperty: async (propertyId: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/scheduled/property/${propertyId}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    }
};

// Published Posts API
export const publishedPostsApi = {
    // Get all published posts
    getAll: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/posts/published?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get by ID
    getById: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/published/${id}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Update metrics
    updateMetrics: async (id: string, metrics: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/published/${id}/metrics`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ metrics })
        });
        return response.json();
    },

    // Get stats
    getStats: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/published/stats`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get by property
    getByProperty: async (propertyId: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/published/property/${propertyId}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Refresh metrics from platform
    refresh: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/posts/published/${id}/refresh`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response.json();
    }
};

// Analytics API
export const analyticsApi = {
    // Get overview
    getOverview: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/analytics/overview?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get platform analytics
    getPlatforms: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/analytics/platforms`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get posting trends
    getTrends: async (days: number = 30): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/analytics/trends?days=${days}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get property analytics
    getProperties: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/analytics/properties`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Get engagement metrics
    getEngagement: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/analytics/engagement`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // AI Forecast: linear regression on last 30 days to project next 14 days
    getForecast: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/analytics/forecast`, {
            headers: getAuthHeaders()
        });
        return response.json();
    }
};

// WhatsApp API
export const whatsappApi = {
    // Templates
    getTemplates: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/templates`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    syncTemplates: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/templates/sync`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    createTemplate: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/templates`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getTemplateById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/templates/${id}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    deleteTemplate: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/templates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Campaigns
    getCampaigns: async (): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    createCampaign: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getCampaignById: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns/${id}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    updateCampaign: async (id: string, data: any) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteCampaign: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getCampaignStats: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/campaigns/${id}/stats`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    // Messages
    getMessages: async (params: Record<string, any> = {}): Promise<any> => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/messages?${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    sendMessage: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Meta Info
    getBusinessInfo: async (wabaId: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/business/${wabaId}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getPhoneInfo: async (phoneId: string) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/phone/${phoneId}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getWebhookInfo: async () => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/webhook/info`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },
    getBotConfig: async () => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/bot-config`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },
    updateBotConfig: async (config: any) => {
        const response = await fetch(`${API_BASE_URL}/social/whatsapp/bot-config`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        return response.json();
    }
};

// Automation Hub API
export const automationApi = {
    getStats: async (params?: any): Promise<any> => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/social/automation/stats${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getWorkflows: async (params?: any): Promise<any> => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/social/automation/workflows${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getWaitingLeads: async (params?: any): Promise<any> => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/social/automation/waiting-leads${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    getMatchedLeads: async (params?: any): Promise<any> => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/social/automation/matched-leads${query}`, {
            headers: getAuthHeaders()
        });
        return response.json();
    },

    createWorkflow: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/workflows`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updateWorkflow: async (id: string, data: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/workflows/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteWorkflow: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/workflows/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    toggleWorkflowStatus: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/workflows/${id}/toggle`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return response.json();
    },

    forceMatch: async (leadId: string, tenantId?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/force-match`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ leadId, tenantId })
        });
        return response.json();
    },
    previewMatch: async (leadId: string, tenantId?: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/social/automation/preview-match`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ leadId, tenantId })
        });
        return response.json();
    }
};

// Export all APIs
export default {
    connectedAccounts: connectedAccountsApi,
    scheduledPosts: scheduledPostsApi,
    publishedPosts: publishedPostsApi,
    analytics: analyticsApi,
    whatsapp: whatsappApi,
    automation: automationApi
};

