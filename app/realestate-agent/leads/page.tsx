'use client';

import React, { useState, useEffect } from 'react';
import { agentService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import { useAuthContext } from '@/app/contexts/AuthContext';
import StructuredLossModal from '@/components/modules/realestate/leads/StructuredLossModal';

export default function AgentLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [statusUpdate, setStatusUpdate] = useState({ status: 1, notes: '' });
    const [saving, setSaving] = useState(false);
    const [showLossModal, setShowLossModal] = useState(false);
    const [leadToMarkLost, setLeadToMarkLost] = useState<any>(null);
    const { hasModule } = useAuthContext();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await agentService.getMyLeads(token);
            if (res.success && res.data) {
                setLeads(res.data.leads || []);
            }
        } catch (error) {
            console.error('Failed to load leads', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (statusUpdate.status === 5 && hasModule('deal_intelligence')) {
            setLeadToMarkLost(selectedLead);
            setSelectedLead(null);
            setShowLossModal(true);
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        setSaving(true);
        try {
            const res = await agentService.updateMyLeadStatus(
                token,
                selectedLead.id,
                statusUpdate.status,
                statusUpdate.notes
            );
            if (res.success) {
                alert('Status updated successfully');
                setSelectedLead(null);
                setStatusUpdate({ status: 1, notes: '' });
                loadLeads();
            }
        } catch (error) {
            console.error('Update error', error);
            alert('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const confirmLoss = async (lossData: any) => {
        if (!leadToMarkLost) return;

        const token = getAuthToken();
        if (!token) return;

        setSaving(true);
        try {
            const { leadService } = await import('@/app/services/api');
            const res = await leadService.markAsLost(token, leadToMarkLost.id, lossData);
            if (res.success) {
                alert('Lead marked as lost correctly.');
                setShowLossModal(false);
                setLeadToMarkLost(null);
                setStatusUpdate({ status: 1, notes: '' });
                loadLeads();
            }
        } catch (error) {
            console.error('Error marking lead as lost:', error);
            alert('Failed to mark lead as lost');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-primary-subtle text-primary">New</span>;
            case 2: return <span className="badge bg-info-subtle text-info">Contacted</span>;
            case 3: return <span className="badge bg-warning-subtle text-warning">Qualified</span>;
            case 4: return <span className="badge bg-success-subtle text-success">Converted</span>;
            case 5: return <span className="badge bg-danger-subtle text-danger">Lost</span>;
            default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
        }
    };

    return (
        <MainLayout activePage="leads">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">My Assigned Leads</h4>
                        <p className="text-muted small mb-0">Track and update the status of your assigned prospects</p>
                    </div>
                    <button className="btn btn-light border btn-sm" onClick={loadLeads}>
                        <i className="bi bi-arrow-clockwise me-2"></i>Refresh
                    </button>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                    <div className="card-body p-0">
                        <div className="vi-table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Lead Info</th>
                                        <th>Property/Unit</th>
                                        <th>Status</th>
                                        <th>Assigned Date</th>
                                        <th className="pe-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5">
                                                <Loader size="sm" message="" />
                                            </td>
                                        </tr>
                                    ) : leads.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">No leads assigned yet.</td>
                                        </tr>
                                    ) : (
                                        leads.map(lead => (
                                            <tr key={lead.id}>
                                                <td className="ps-4">
                                                    <div className="fw-bold">{lead.name}</div>
                                                    <div className="small text-muted">{lead.email} | {lead.phone}</div>
                                                </td>
                                                <td className="small">
                                                    {lead.property?.title || 'General Inquiry'}
                                                    {lead.unit?.unitCode && <span className="text-muted ms-1">({lead.unit.unitCode})</span>}
                                                </td>
                                                <td>{getStatusBadge(lead.status)}</td>
                                                <td className="small text-muted">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                                <td className="pe-4 text-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            setSelectedLead(lead);
                                                            setStatusUpdate({ ...statusUpdate, status: lead.status });
                                                        }}
                                                    >
                                                        Update Status
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {selectedLead && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4 pb-0">
                                    <h5 className="modal-title fw-bold">Update Lead: {selectedLead.name}</h5>
                                    <button type="button" className="btn-close" onClick={() => setSelectedLead(null)}></button>
                                </div>
                                <form onSubmit={handleUpdateStatus}>
                                    <div className="modal-body p-4 text-muted">
                                        <div className="mb-3">
                                            <label className="form-label small text-uppercase fw-bold">Current Status</label>
                                            <select
                                                className="form-select border-0 bg-light"
                                                value={statusUpdate.status}
                                                onChange={e => setStatusUpdate({ ...statusUpdate, status: parseInt(e.target.value) })}
                                                required
                                            >
                                                <option value={1}>New</option>
                                                <option value={2}>Contacted</option>
                                                <option value={3}>Qualified</option>
                                                <option value={4}>Converted (Deal Closed)</option>
                                                <option value={5}>Lost</option>
                                            </select>
                                        </div>
                                        <div className="mb-0">
                                            <label className="form-label small text-uppercase fw-bold">Follow-up Notes</label>
                                            <textarea
                                                className="form-control border-0 bg-light"
                                                rows={4}
                                                placeholder="Enter progress details..."
                                                value={statusUpdate.notes}
                                                onChange={e => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 pt-0">
                                        <button type="button" className="btn btn-light" onClick={() => setSelectedLead(null)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Update'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <StructuredLossModal
                    show={showLossModal}
                    onClose={() => {
                        setShowLossModal(false);
                        setLeadToMarkLost(null);
                    }}
                    onConfirm={confirmLoss}
                    leadName={leadToMarkLost?.name || ''}
                    isSubmitting={saving}
                />
            </div>
        </MainLayout>
    );
}
