'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { leadService, agentService, marketingService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import { Agent } from '@/types';
import LeadEngagementInsights from './LeadEngagementInsights';
import LeadsKanban from './LeadsKanban';

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    source: 'website' | 'email' | 'phone' | 'social' | 'referral' | 'other' | 'chatbot';
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    budget: number;
    requirements: string;
    notes: string;
    assignedTo: string;
    assignedAgent?: { id: string; user?: { name?: string } };
    priority?: number;
    leadScore: number;
    createdAt: string;
    updatedAt: string;
    lastContacted: string | null;
    tags?: string[];
    userId?: string;
    enrollments?: Array<{ workflow: { name: string } }>;
}

interface LeadsManagerProps {
    mode: 'admin' | 'owner';
}

export default function LeadsManager({ mode }: LeadsManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId, currencySymbol } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [formData, setFormData] = useState<Partial<Lead & { agentId: string }>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'website',
        status: 'new',
        budget: 0,
        requirements: '',
        notes: '',
        assignedTo: '',
        priority: 2,
        agentId: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [filterTag, setFilterTag] = useState<string>('all');
    const [filterBudget, setFilterBudget] = useState<number | ''>('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [selectedLeadForInsights, setSelectedLeadForInsights] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
    const [isLoading, setIsLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadLeads = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const token = getAuthToken();
            if (!token) {
                if (!silent) setIsLoading(false);
                return;
            }

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const response = await leadService.getLeads(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });

            if (response.success && response.data && response.data.leads) {
                const mappedLeads: Lead[] = response.data.leads.map((l: any) => {
                    const dbTags = l.tags ? l.tags.split(',').filter(Boolean) : [];
                    const workflowTags = l.enrollments?.map((e: any) => `Workflow: ${e.workflow?.name}`) || [];

                    return {
                        id: l.id,
                        name: l.name || 'Anonymous',
                        email: l.email || '',
                        phone: l.phone || '',
                        company: l.company || '',
                        source: l.source === 1 ? 'website' :
                            l.source === 2 ? 'email' :
                                l.source === 3 ? 'phone' :
                                    l.source === 4 ? 'social' :
                                        l.source === 5 ? 'referral' :
                                            l.source === 7 ? 'chatbot' : 'other',
                        status: l.status === 1 ? 'new' :
                            l.status === 2 ? 'contacted' :
                                l.status === 3 ? 'qualified' :
                                    l.status === 4 ? 'converted' : 'lost',
                        budget: l.budget ? Number(l.budget) : 0,
                        requirements: l.message || '',
                        notes: l.notes || '',
                        assignedTo: l.assignedTo || '',
                        assignedAgent: l.agent,
                        priority: l.priority || 2,
                        leadScore: l.leadScore || 0,
                        createdAt: l.createdAt,
                        updatedAt: l.updatedAt || l.createdAt,
                        lastContacted: l.lastContacted || null,
                        tags: [...dbTags, ...workflowTags],
                        userId: l.userId,
                        enrollments: l.enrollments
                    };
                });

                // Only update state if leads have actually changed or it's first load
                setLeads(prevLeads => {
                    const hasChanged = JSON.stringify(prevLeads) !== JSON.stringify(mappedLeads);
                    return hasChanged ? mappedLeads : prevLeads;
                });
            }
        } catch (error) {
            console.error('Failed to load leads:', error);
            setLeads([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const loadAgents = async () => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await agentService.getAgents(token, { status: 1 }); // Active agents
            if (res.success && res.data) {
                setAgents(res.data.agents);
            }
        } catch (error) {
            console.error('Failed to load agents', error);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadLeads();
        loadAgents();

        // Implement Option 1: Polling every 30 seconds
        const pollInterval = setInterval(() => {
            loadLeads(true); // Silent update
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [user, isAuthenticated, mounted, router, activeTenantId, activeOwnerId, tenantType]);

    const allTags = Array.from(new Set(leads.flatMap(l => l.tags || []))).sort();

    const filteredLeads = leads.filter((lead: Lead) => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        const matchesSource = filterSource === 'all' || lead.source === filterSource;
        const matchesTag = filterTag === 'all' || lead.tags?.includes(filterTag);
        const matchesBudget = filterBudget === '' || lead.budget <= Number(filterBudget);
        return matchesSearch && matchesStatus && matchesSource && matchesTag && matchesBudget;
    });

    const handleSaveAsGroup = async () => {
        if (!groupName) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';

            // Create the Audience Group
            const res = await marketingService.createAudienceGroup(token, {
                name: groupName,
                description: `Created from Leads Manager filter: Budget <= ${filterBudget || 'Any'}`,
                tenantId,
                isDynamic: filterBudget !== '', // If budget filter is active, it's a dynamic intent
                leadIds: filteredLeads.map(l => l.id) // Send existing leads
            });

            if (res.success) {
                showToast(`Audience group "${groupName}" created with ${filteredLeads.length} leads.`);
                setShowGroupModal(false);
                setGroupName('');
            }
        } catch (error) {
            console.error('Group creation failed:', error);
            showToast('Failed to create audience group', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            if (!token) return;

            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
            if (!tenantId) return;

            const sourceMap: Record<string, number> = {
                'website': 1, 'email': 2, 'phone': 3, 'social': 4, 'referral': 5, 'other': 6, 'chatbot': 7
            };
            const statusMap: Record<string, number> = {
                'new': 1, 'contacted': 2, 'qualified': 3, 'converted': 4, 'lost': 5
            };

            const payload = {
                tenantId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                message: formData.requirements,
                source: sourceMap[formData.source || 'website'] || 1,
                status: statusMap[formData.status || 'new'] || 1,
                budget: formData.budget,
                notes: formData.notes,
                priority: formData.priority || 2,
                agentId: formData.agentId || undefined
            };

            setIsSubmitting(true);
            let res;
            if (editingLead) {
                res = await leadService.updateLead(token, editingLead.id, payload, tenantId);
                if (res.success) {
                    showToast('Lead updated successfully');
                }
            } else {
                res = await leadService.createLead(token, payload);
                if (res.success) {
                    showToast('Lead created successfully');
                }
            }

            if (res.success) {
                loadLeads();
                setIsSubmitting(false);
                resetForm();
            } else {
                setIsSubmitting(false);
                showToast('Failed to save lead', 'error');
            }
        } catch (error) {
            console.error('Failed to save lead:', error);
            showToast('Error saving lead', 'error');
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: Lead['status']) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
            const statusMap: Record<string, number> = {
                'new': 1, 'contacted': 2, 'qualified': 3, 'converted': 4, 'lost': 5
            };
            await leadService.updateLeadStatus(token, id, statusMap[newStatus], tenantId);
            showToast('Status updated successfully');
            loadLeads();
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this lead?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            await leadService.deleteLead(token, id, tenantId);
            showToast('Lead deleted successfully');
            loadLeads();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Error deleting lead', 'error');
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredLeads.map(l => l.id));
        }
    };

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';

            // Sequential delete for safety if bulk endpoint isn't ready
            for (const id of selectedLeads) {
                await leadService.deleteLead(token, id, tenantId);
            }

            showToast(`${selectedLeads.length} leads deleted successfully`);
            setSelectedLeads([]);
            loadLeads();
        } catch (error) {
            console.error('Bulk delete error:', error);
            showToast('Error during bulk deletion', 'error');
        }
    };

    const handleExportLeads = () => {
        const leadsToExport = selectedLeads.length > 0
            ? leads.filter(l => selectedLeads.includes(l.id))
            : filteredLeads;

        if (leadsToExport.length === 0) {
            showToast('No leads to export', 'error');
            return;
        }

        const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Budget', 'Created'];
        const csvContent = [
            headers.join(','),
            ...leadsToExport.map(l => [
                `"${l.name.replace(/"/g, '""')}"`,
                `"${l.email}"`,
                `"${l.phone}"`,
                `"${l.company?.replace(/"/g, '""') || ''}"`,
                l.source,
                l.status,
                l.budget,
                new Date(l.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConvertToUser = async (lead: Lead) => {
        setConvertingLead(lead);
        // Show a confirmation modal or just do it? Usually needs a password or role
        // For now, let's just trigger a modal or show a message.
        // I will assume there's a need to confirm first.
    };

    const confirmConversion = async (userData: any) => {
        if (!convertingLead) return;
        try {
            setIsConverting(true);
            const token = getAuthToken();
            if (!token) return;

            // Use leadService or authService to convert
            // Since I haven't added the backend yet, I'll assume I'll call a hypothetical endpoint
            // or I can add it now.
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
            const { id: _, requirements, assignedAgent, leadScore, createdAt, updatedAt, lastContacted, tags, assignedTo, ...leadParams } = convertingLead;
            const res = await leadService.updateLead(token, convertingLead.id, {
                ...leadParams,
                message: requirements, // Map requirements to message for API
                preferences: { tags }, // Wrap tags in preferences for API
                status: 4, // Converted
                isConvertedToUser: true,
                userCreationData: userData
            }, tenantId);

            if (res.success) {
                showToast(`Lead ${convertingLead.name} successfully converted to a User!`);
                setConvertingLead(null);
                loadLeads();
            } else {
                showToast(res.message || 'Failed to convert lead', 'error');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            showToast('Error converting lead', 'error');
        } finally {
            setIsConverting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', email: '', phone: '', company: '', source: 'website', status: 'new', budget: 0, requirements: '', notes: '', assignedTo: '', agentId: ''
        });
        setEditingLead(null);
        setShowModal(false);
        setSuccessMessage(null);
        setIsSubmitting(false);
    };

    const getStatusBadge = (status: Lead['status']) => {
        const config: any = {
            new: { class: 'bg-primary-soft text-primary', text: 'New' },
            contacted: { class: 'bg-info-soft text-info', text: 'Contacted' },
            qualified: { class: 'bg-warning-soft text-warning', text: 'Qualified' },
            converted: { class: 'bg-success-soft text-success', text: 'Converted' },
            lost: { class: 'bg-danger-soft text-danger', text: 'Lost' }
        };
        const c = config[status] || config.new;
        return <span className={`badge rounded-4 px-3 py-2 ${c.class}`}>{c.text}</span>;
    };

    if (!mounted || !isAuthenticated) return null;

    const stats = {
        total: leads.length,
        pipeline: leads.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).reduce((sum, l) => sum + (l.budget || 0), 0),
        conversionRate: leads.length ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0,
        avgScore: leads.length ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length) : 0
    };

    const isStale = (lead: Lead) => {
        const lastActivity = lead.lastContacted ? new Date(lead.lastContacted) : new Date(lead.createdAt);
        const diffDays = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 3 && !['converted', 'lost'].includes(lead.status);
    };

    return (
        <MainLayout activePage="leads">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">CRM & Leads</h1>
                        <p className="text-muted small mb-0">Track and manage your potential customers</p>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="btn-group p-1 bg-light rounded-3 shadow-sm" style={{ border: '1px solid #eee' }}>

                            <button
                                className={`btn btn-sm px-3 rounded-2 ${viewMode === 'kanban' ? 'btn-white shadow-sm fw-bold' : 'btn-light border-0 text-muted'}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                <i className="bi bi-kanban me-2"></i>Kanban
                            </button>
                            <button
                                className={`btn btn-sm px-3 rounded-2 ${viewMode === 'table' ? 'btn-white shadow-sm fw-bold' : 'btn-light border-0 text-muted'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <i className="bi bi-table me-2"></i>Table
                            </button>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button className="btn btn-outline-secondary btn-sm rounded-4 px-3 shadow-sm d-flex align-items-center gap-2" onClick={handleExportLeads}>
                                <i className="bi bi-download"></i>
                                <span>Export {selectedLeads.length > 0 ? `(${selectedLeads.length})` : ''}</span>
                            </button>
                            {(filterBudget !== '' || filterStatus !== 'all' || filterSource !== 'all') && (
                                <button className="btn btn-outline-primary btn-sm rounded-4 px-3 shadow-sm d-flex align-items-center gap-2" onClick={() => setShowGroupModal(true)}>
                                    <i className="bi bi-people-fill"></i>
                                    <span>Save as Group</span>
                                </button>
                            )}
                            {selectedLeads.length > 0 && (
                                <button className="btn btn-danger-soft text-danger btn-sm rounded-4 px-3 shadow-sm d-flex align-items-center gap-2" onClick={handleBulkDelete}>
                                    <i className="bi bi-trash-fill"></i>
                                    <span>Delete ({selectedLeads.length})</span>
                                </button>
                            )}
                            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => { setEditingLead(null); resetForm(); setShowModal(true); }}>
                                <i className="bi bi-person-plus-fill"></i>
                                <span>Add New Lead</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                                    <input type="text" className="form-control bg-light border-0" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="all">Status: All</option>
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="converted">Converted</option>
                                    <option value="lost">Lost</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                                    <option value="all">Source: All</option>
                                    <option value="website">Website</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="social">Social</option>
                                    <option value="referral">Referral</option>
                                    <option value="chatbot">Chatbot</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                                    <option value="all">Tag: All</option>
                                    {allTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2">
                                <div className="px-1">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="form-label extra-small text-muted fw-bold text-uppercase mb-0">Budget</label>
                                        <div className="input-group input-group-sm rounded-3 shadow-none border" style={{ width: '80px' }}>
                                            <input
                                                type="number"
                                                className="form-control border-0 bg-transparent p-0 ps-1 small"
                                                placeholder="Any"
                                                value={filterBudget}
                                                onChange={(e) => setFilterBudget(e.target.value ? Number(e.target.value) : '')}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        className="form-range"
                                        min="0"
                                        max="1000000"
                                        step="1000"
                                        value={filterBudget === '' ? 1000000 : filterBudget}
                                        onChange={(e) => setFilterBudget(e.target.value === '1000000' ? '' : Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="col-md-1 d-flex align-items-center justify-content-end">
                                <span className="fw-bold text-primary">{filteredLeads.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h5 className="text-muted fw-light">Fetching your leads...</h5>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                        <div className="vi-table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3" style={{ width: '40px' }}>
                                            <div className="form-check mb-0">
                                                <input
                                                    className="form-check-input cursor-pointer"
                                                    type="checkbox"
                                                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Lead Name</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Agent</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Score</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Priority</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Contact Info</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Source</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Tags</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Created</th>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.length === 0 ? (
                                        <tr><td colSpan={9} className="text-center py-5 text-muted">No leads found</td></tr>
                                    ) : filteredLeads.map(lead => (
                                        <tr key={lead.id} className={`${isStale(lead) ? 'bg-stale' : ''} ${selectedLeads.includes(lead.id) ? 'bg-primary bg-opacity-10' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="form-check mb-0">
                                                    <input
                                                        className="form-check-input cursor-pointer"
                                                        type="checkbox"
                                                        checked={selectedLeads.includes(lead.id)}
                                                        onChange={() => toggleSelectLead(lead.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar-xs bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div className="cursor-pointer d-flex align-items-center gap-2" onClick={() => setSelectedLeadForInsights(lead)}>
                                                        <div>
                                                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                                {lead.name}
                                                                {isStale(lead) && (
                                                                    <span className="badge bg-danger rounded-4 extra-small-badge" title="No activity for 3+ days">REQUIRES ATTENTION</span>
                                                                )}
                                                                <i className="bi bi-magic text-primary pulse-ai" title="View AI Matches" style={{ fontSize: '0.8rem' }}></i>
                                                            </div>
                                                            <div className="small text-muted">{lead.company || 'No Company'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {lead.assignedAgent ? (
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-person-check text-success me-2"></i>
                                                        <span className="small fw-medium">{lead.assignedAgent.user?.name || 'Unknown Agent'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-light text-muted border">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`badge rounded-4 px-2 py-1 ${lead.leadScore > 50 ? 'bg-danger' : lead.leadScore > 20 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                        {lead.leadScore}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {lead.priority === 3 ? (
                                                    <span className="badge bg-danger-soft text-danger px-2">High</span>
                                                ) : lead.priority === 2 ? (
                                                    <span className="badge bg-warning-soft text-warning px-2">Medium</span>
                                                ) : (
                                                    <span className="badge bg-info-soft text-info px-2">Low</span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="small text-dark fw-medium">{lead.email}</div>
                                                <div className="small text-muted">{lead.phone}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="badge bg-light text-dark border fw-normal text-capitalize">{lead.source}</span>
                                            </td>
                                            <td className="py-3">{getStatusBadge(lead.status)}</td>
                                            <td className="py-3">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {lead.tags?.map(tag => (
                                                        <span key={tag} className={`badge ${tag.startsWith('Workflow:') ? 'bg-purple-soft text-purple border-purple' : 'bg-primary bg-opacity-10 text-white border-primary'} border-opacity-10 rounded-4 extra-small-badge`}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 small text-muted">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="btn-group">
                                                    <button className="btn btn-sm btn-light border" onClick={() => {
                                                        setEditingLead(lead);
                                                        setFormData({
                                                            ...lead,
                                                            agentId: lead.assignedAgent?.id || ''
                                                        } as any);
                                                        setShowModal(true);
                                                    }}><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-sm btn-light border dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"></button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                                        <li><h6 className="dropdown-header small text-uppercase">Change Status</h6></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(lead.id, 'contacted')}>Mark as Contacted</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(lead.id, 'qualified')}>Mark as Qualified</button></li>
                                                        <li><button className="dropdown-item text-success" onClick={() => handleStatusChange(lead.id, 'converted')}>Converted</button></li>
                                                        <li><button className="dropdown-item text-danger" onClick={() => handleStatusChange(lead.id, 'lost')}>Lost</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item text-danger" onClick={() => handleDelete(lead.id)}><i className="bi bi-trash me-2"></i>Delete</button></li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <LeadsKanban
                        leads={filteredLeads}
                        onStatusChange={handleStatusChange}
                        onConvertToUser={handleConvertToUser}
                        onEdit={(lead) => {
                            setEditingLead(lead);
                            setFormData({
                                ...lead,
                                agentId: lead.assignedAgent?.id || ''
                            } as any);
                            setShowModal(true);
                        }}
                        onDelete={handleDelete}
                        onViewInsights={(lead) => setSelectedLeadForInsights(lead)}
                        isStale={isStale}
                        currencySymbol={currencySymbol}
                    />
                )}
            </div>

            {/* Lead Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">{editingLead ? 'Update Lead' : 'Create New Lead'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Full Name</label>
                                            <input type="text" className="form-control bg-light border-0" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Email Address</label>
                                            <input type="email" className="form-control bg-light border-0" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Phone Number</label>
                                            <input type="text" className="form-control bg-light border-0" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Company Name</label>
                                            <input type="text" className="form-control bg-light border-0" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Assign Agent</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.agentId}
                                                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                                            >
                                                <option value="">Auto-Assign (Round Robin)</option>
                                                {agents.map(agent => (
                                                    <option key={agent.id} value={agent.id}>
                                                        {agent.user?.name || agent.id} ({agent.totalLeads} leads)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Budget</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">{currencySymbol}</span>
                                                <input type="number" className="form-control bg-light border-0" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Priority Level</label>
                                            <select className="form-select bg-light border-0" value={formData.priority || 2} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}>
                                                <option value={1}>Low</option>
                                                <option value={2}>Medium</option>
                                                <option value={3}>High</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Lead Source</label>
                                            <select className="form-select bg-light border-0" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as any })} required>
                                                <option value="website">Website</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="social">Social</option>
                                                <option value="referral">Referral</option>
                                                <option value="chatbot">Chatbot</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Current Status</label>
                                            <select className="form-select bg-light border-0" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} required>
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="qualified">Qualified</option>
                                                <option value="converted">Converted</option>
                                                <option value="lost">Lost</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Requirements / Message</label>
                                            <textarea className="form-control bg-light border-0" rows={3} value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="What is the customer looking for?"></textarea>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Internal Notes</label>
                                            <textarea className="form-control bg-light border-0" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Shared team notes..."></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={resetForm}>Discard</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
            .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
            .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
            .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
            .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
            .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
            .bg-purple-soft { background-color: rgba(111, 66, 193, 0.1); }
            .text-purple { color: #6f42c1; }
            .border-purple { border-color: rgba(111, 66, 193, 0.2) !important; }
            .pulse-ai { animation: pulse-purple 2s infinite; cursor: pointer; }
            .btn-white { background-color: #fff; border: 1px solid #dee2e6; }
            .btn-white:hover { background-color: #f8f9fa; }
            .extra-small-badge { font-size: 0.6rem; padding: 0.2rem 0.5rem; letter-spacing: 0.5px; }
            .bg-stale { background-color: rgba(220, 53, 69, 0.02); }
            @keyframes pulse-purple {
                0% { transform: scale(0.9); opacity: 0.6; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(0.9); opacity: 0.6; }
            }
        `}</style>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {selectedLeadForInsights && (
                <LeadEngagementInsights
                    leadId={selectedLeadForInsights.id}
                    leadName={selectedLeadForInsights.name}
                    leadScore={selectedLeadForInsights.leadScore}
                    onClose={() => setSelectedLeadForInsights(null)}
                />
            )}

            {showGroupModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">Save as Marketing Group</h5>
                                <button type="button" className="btn-close" onClick={() => setShowGroupModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-4">You are creating an audience group with <strong>{filteredLeads.length} leads</strong> based on your current filters.</p>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">Audience Group Name</label>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 py-2"
                                        placeholder="e.g. Low Budget Prospects"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-10">
                                    <div className="extra-small text-primary fw-bold mb-1"><i className="bi bi-info-circle me-1"></i>Marketing Hub Shared</div>
                                    <div className="extra-small text-muted">This group will be immediately available in the Marketing Hub for email campaigns and automated workflows.</div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setShowGroupModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-4 px-4 fw-bold shadow-sm" onClick={handleSaveAsGroup} disabled={!groupName}>
                                    Create Group
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {convertingLead && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">Convert Lead to User</h5>
                                <button type="button" className="btn-close" onClick={() => setConvertingLead(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-4">You are about to create a registered user account for <strong>{convertingLead.name}</strong> ({convertingLead.email}).</p>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">Assign Role</label>
                                    <select className="form-select bg-light border-0 py-2" id="userRole">
                                        <option value="1">Regular User / Customer</option>
                                        <option value="4">Sales Agent (Promotion)</option>
                                    </select>
                                    <div className="form-text extra-small">The user will be invited to set their own password.</div>
                                </div>

                                <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-10">
                                    <div className="extra-small text-success fw-bold mb-1"><i className="bi bi-check-circle-fill me-1"></i>Account Synchronization</div>
                                    <div className="extra-small text-muted">This lead's history, notes, and preferences will be automatically linked to their new user profile.</div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setConvertingLead(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-success rounded-4 px-4 fw-bold shadow-sm"
                                    disabled={isConverting}
                                    onClick={() => {
                                        const role = (document.getElementById('userRole') as HTMLSelectElement)?.value;
                                        confirmConversion({ role });
                                    }}
                                >
                                    {isConverting ? 'Converting...' : 'Complete Conversion'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
