'use client';

import { useState, useEffect, useMemo } from 'react';
import { marketingService, leadService, propertyService, getAuthToken } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AudienceManagerProps {
    tenantId: string;
}

export default function AudienceManager({ tenantId }: AudienceManagerProps) {
    const queryClient = useQueryClient();
    const [activeAudienceTab, setActiveAudienceTab] = useState<'groups' | 'contacts'>('groups');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [groupData, setGroupData] = useState({
        name: '', description: '', isDynamic: false, leadIds: [] as string[], propertyId: '', listingId: ''
    });
    const [viewingGroup, setViewingGroup] = useState<any | null>(null);
    const [leadSearchTerm, setLeadSearchTerm] = useState('');
    const [loadingGroup, setLoadingGroup] = useState(false);

    const token = typeof window !== 'undefined' ? getAuthToken() : '';

    const { data: groupsRes, isLoading: groupsLoading } = useQuery({
        queryKey: ['audience-groups', tenantId],
        queryFn: () => marketingService.getAudienceGroups(token!, { tenantId }),
        enabled: !!token && !!tenantId,
    });

    const { data: leadsRes, isLoading: leadsLoading } = useQuery({
        queryKey: ['contacts', tenantId],
        queryFn: () => leadService.getLeads(token!, { tenantId }),
        enabled: !!token && !!tenantId,
    });

    const { data: propsRes } = useQuery({
        queryKey: ['properties-list', tenantId],
        queryFn: () => propertyService.getProperties(token!, { tenantId }),
        enabled: !!token && !!tenantId,
    });

    const groups = groupsRes?.data || [];
    const leads = leadsRes?.data?.leads || [];
    const properties = propsRes?.data?.properties || [];
    const loading = groupsLoading || leadsLoading;

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: (payload: any) => {
            if (isEditing && currentGroupId) return marketingService.updateAudienceGroup(token!, currentGroupId, payload);
            return marketingService.createAudienceGroup(token!, payload);
        },
        onSuccess: (res) => {
            if (res.success) {
                setShowModal(false);
                queryClient.invalidateQueries({ queryKey: ['audience-groups'] });
                resetForm();
            }
        }
    });

    const removeLeadMutation = useMutation({
        mutationFn: ({ groupId, payload }: { groupId: string, payload: any }) => marketingService.updateAudienceGroup(token!, groupId, payload),
        onSuccess: (res) => {
            if (res.success) queryClient.invalidateQueries({ queryKey: ['audience-groups'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => marketingService.deleteAudienceGroup(token!, id),
        onSuccess: (res) => {
            if (res.success) queryClient.invalidateQueries({ queryKey: ['audience-groups'] });
        }
    });

    const handleSave = () => {
        if (!groupData.name) return;
        const payload = {
            ...groupData,
            tenantId,
            propertyId: groupData.propertyId || groupData.listingId,
            listingId: groupData.propertyId || groupData.listingId
        };
        saveMutation.mutate(payload);
    };

    const isSaving = saveMutation.isPending;

    const fetchGroupDetails = async (groupId: string) => {
        setLoadingGroup(true);
        try {
            const token = getAuthToken();
            if (!token) return null;
            const res = await marketingService.getAudienceGroupById(token, groupId);
            if (res.success) {
                queryClient.setQueryData(['audience-groups', tenantId], (old: any) => {
                    const list = old?.data || [];
                    return { ...old, data: list.map((g: any) => g.id === groupId ? res.data : g) };
                });
                return res.data;
            }
        } catch (error) {
            console.error('Failed to fetch group details:', error);
        } finally {
            setLoadingGroup(false);
        }
        return null;
    };

    const handleRemoveLead = (groupId: string, leadId: string) => {
        if (!window.confirm('Are you sure you want to remove this lead from the group?')) return;
        const group = groups.find((g: any) => g.id === groupId);
        if (!group) return;
        const currentIds = getAssociatedLeadIds(group);
        const updatedIds = currentIds.filter(id => id !== leadId);
        removeLeadMutation.mutate({ groupId, payload: { ...group, leadIds: updatedIds, tenantId } });
    };

    const handleDelete = (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will not delete the leads themselves.`)) return;
        deleteMutation.mutate(id);
    };

    const getAssociatedLeadIds = (group: any): string[] => {
        if (!group) return [];
        // Support leads, groupLeads, leadAssociations, and direct lead ID arrays
        const associated = group.leads || group.groupLeads || group.leadAssociations || [];

        return associated.map((l: any) => {
            if (!l) return null;
            if (typeof l === 'string') return l;
            if (typeof l === 'object') {
                // Return leadId if it exists (for association objects) otherwise the item's own id
                return l.leadId || l.id || (l.lead && (l.lead.id || l.lead));
            }
            return null;
        }).filter((id: any) => typeof id === 'string');
    };

    const openEdit = async (group: any) => {
        let fullGroup = group;
        // If leads or details are missing, fetch the full group object
        if (!group.leads && !group.groupLeads && !group.leadAssociations) {
            fullGroup = await fetchGroupDetails(group.id) || group;
        }

        const extractedIds = getAssociatedLeadIds(fullGroup);
        const propId = fullGroup.propertyId ||
            fullGroup.listingId ||
            fullGroup.filters?.propertyId ||
            (fullGroup.property && (fullGroup.property.id || fullGroup.property)) || '';

        setGroupData({
            name: fullGroup.name || '',
            description: fullGroup.description || '',
            isDynamic: !!fullGroup.isDynamic,
            leadIds: extractedIds,
            propertyId: propId,
            listingId: propId
        });
        setCurrentGroupId(fullGroup.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setGroupData({ name: '', description: '', isDynamic: false, leadIds: [], propertyId: '', listingId: '' });
        setIsEditing(false);
        setCurrentGroupId(null);
    };

    const toggleLeadSelection = (leadId: string) => {
        setGroupData(prev => ({
            ...prev,
            leadIds: prev.leadIds.includes(leadId)
                ? prev.leadIds.filter(id => id !== leadId)
                : [...prev.leadIds, leadId]
        }));
    };

    const filteredLeads = leads.filter((l: any) =>
    (l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectableLeads = leads.filter((l: any) =>
        l.name?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(leadSearchTerm.toLowerCase())
    );

    if (viewingGroup) {
        // Use the most up-to-date version of the group from state
        const liveGroup = groups.find((g: any) => g.id === viewingGroup.id) || viewingGroup;
        const memberIds = getAssociatedLeadIds(liveGroup);
        const groupMembers = leads.filter((l: any) => memberIds.includes(l.id));

        return (
            <div className="audience-manager">
                {loadingGroup ? (
                    <div className="py-5">
                        <Loader message="Loading group members..." />
                    </div>
                ) : (
                    <>
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => setViewingGroup(null)}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                            <div>
                                <h5 className="fw-bold mb-0">{liveGroup.name}</h5>
                                <div className="d-flex align-items-center gap-2 text-muted small">
                                    <span className="fw-bold text-primary">{groupMembers.length} Members</span>
                                    <span>•</span>
                                    <span>{liveGroup.description || 'No description'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                            <div className="vi-table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 small fw-bold text-muted">Member Name</th>
                                            <th className="py-3 small fw-bold text-muted">Email</th>
                                            <th className="py-3 small fw-bold text-muted">Source</th>
                                            <th className="px-4 py-3 small fw-bold text-muted text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupMembers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-5">
                                                    <i className="bi bi-person-x display-6 text-muted opacity-25 d-block mb-2"></i>
                                                    <p className="text-muted small mb-0">No contacts found in this group.</p>
                                                    {leads.length === 0 && <p className="extra-small text-info mt-1">Contacts list is empty or still loading...</p>}
                                                </td>
                                            </tr>
                                        ) : groupMembers.map((lead: any) => (
                                            <tr key={lead.id}>
                                                <td className="px-4 py-3 fw-bold small">{lead.name || 'Anonymous'}</td>
                                                <td className="py-3 small text-muted">{lead.email}</td>
                                                <td className="py-3"><span className="badge bg-light text-dark border extra-small">{lead.source === 1 ? 'Website' : 'Other'}</span></td>
                                                <td className="px-4 py-3 text-end">
                                                    <button
                                                        className="btn btn-link text-danger p-0 hvr-grow"
                                                        title="Remove from group"
                                                        onClick={() => handleRemoveLead(liveGroup.id, lead.id)}
                                                    >
                                                        <i className="bi bi-person-dash fs-5"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="audience-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="btn-group bg-light p-1 rounded-4 shadow-sm">
                    <button
                        className={`btn btn-sm rounded-4 px-4 fw-bold ${activeAudienceTab === 'groups' ? 'btn-white shadow-sm' : 'border-0 text-muted'}`}
                        onClick={() => setActiveAudienceTab('groups')}
                    >
                        Groups ({groups.length})
                    </button>
                    <button
                        className={`btn btn-sm rounded-4 px-4 fw-bold ${activeAudienceTab === 'contacts' ? 'btn-white shadow-sm' : 'border-0 text-muted'}`}
                        onClick={() => setActiveAudienceTab('contacts')}
                    >
                        All Contacts ({leads.length})
                    </button>
                </div>
                {activeAudienceTab === 'groups' ? (
                    <button className="btn btn-primary btn-sm rounded-4 px-3 fw-bold" onClick={() => { resetForm(); setShowModal(true); }}>
                        <i className="bi bi-person-plus me-1"></i> New Group
                    </button>
                ) : (
                    <div className="input-group input-group-sm w-auto">
                        <span className="input-group-text bg-white border-end-0 rounded-start-pill"><i className="bi bi-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control border-start-0 rounded-end-pill px-3"
                            placeholder="Search contacts..."
                            style={{ width: '200px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-5">
                    <Loader message="Loading audience data..." />
                </div>
            ) : activeAudienceTab === 'groups' ? (
                groups.length === 0 ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50">
                        <i className="bi bi-people display-4 text-muted opacity-25 mb-3"></i>
                        <h6 className="fw-bold">Build Your Audience</h6>
                        <p className="text-muted small">Organize your leads into groups or smart segments for targeted marketing.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {groups.map((group: any) => (
                            <div key={group.id} className="col-md-6 col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 group-card">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className={`p-3 rounded-4 ${group.isDynamic ? 'bg-info text-info' : 'bg-primary text-white'} bg-opacity-10`}>
                                            <i className={`bi ${group.isDynamic ? 'bi-lightning-charge-fill' : 'bi-people-fill'} fs-4`}></i>
                                        </div>
                                        <div className="dropdown">
                                            <button className="btn btn-link btn-sm p-0 text-muted" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                                <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={async () => { setViewingGroup(group); await fetchGroupDetails(group.id); }}><i className="bi bi-eye"></i> View Members</button></li>
                                                <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => openEdit(group)}><i className="bi bi-pencil"></i> Edit Details</button></li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li><button className="dropdown-item small text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(group.id, group.name)}><i className="bi bi-trash"></i> Delete Group</button></li>
                                            </ul>
                                        </div>
                                    </div>
                                    <h6 className="fw-bold mb-1">{group.name}</h6>
                                    <p className="text-muted small mb-4 lh-sm">{group.description || 'No description provided.'}</p>

                                    <div className="mt-auto">
                                        {(group.propertyId || group.listingId || group.filters?.propertyId) && (
                                            <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2 bg-light rounded-3">
                                                <i className="bi bi-building small text-primary"></i>
                                                <span className="extra-small text-muted text-truncate" title="Linked Property">
                                                    {properties.find((p: any) => p.id === (group.propertyId || group.listingId || group.filters?.propertyId))?.title || 'Linked Property'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="text-muted extra-small">
                                                <span className="fw-bold text-dark">{group._count?.leads || getAssociatedLeadIds(group).length}</span> Members
                                            </div>
                                            {group.isDynamic && <span className="badge bg-info bg-opacity-10 text-info border-info border-opacity-25 extra-small">Smart Segment</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                    <div className="vi-table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light bg-opacity-50">
                                <tr>
                                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase">Contact</th>
                                    <th className="py-3 small fw-bold text-muted text-uppercase">Source</th>
                                    <th className="py-3 small fw-bold text-muted text-uppercase">Status</th>
                                    <th className="py-3 small fw-bold text-muted text-uppercase">Joined</th>
                                    <th className="py-3 small fw-bold text-muted text-uppercase">Score</th>
                                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-5 text-muted">No contacts found.</td></tr>
                                ) : filteredLeads.map((lead: any) => (
                                    <tr key={lead.id}>
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar bg-primary bg-opacity-1 rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '32px', height: '32px', fontSize: '11px', color: 'white' }}>
                                                    {(lead.name || 'A').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="fw-bold small">{lead.name || 'Anonymous'}</div>
                                                    <div className="extra-small text-muted">{lead.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border fw-normal extra-small px-2">
                                                {lead.source === 1 ? 'Website' : lead.source === 7 ? 'Chatbot' : 'Other'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge rounded-4 extra-small px-2 ${lead.status === 1 ? 'bg-primary bg-opacity-10 text-white' :
                                                lead.status === 4 ? 'bg-success bg-opacity-10 text-white' :
                                                    'bg-light text-muted'
                                                }`}>
                                                {lead.status === 1 ? 'New' : lead.status === 4 ? 'Converted' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="extra-small text-muted">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`badge rounded-4 extra-small px-2 ${lead.score >= 70 ? 'bg-success bg-opacity-10 text-white' :
                                                lead.score >= 40 ? 'bg-warning bg-opacity-10 text-white' :
                                                    'bg-light text-muted'
                                                }`}>
                                                {lead.score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <button className="btn btn-outline-primary btn-xs rounded-4" onClick={() => { resetForm(); setGroupData(d => ({ ...d, leadIds: [lead.id] })); setShowModal(true); }}>
                                                Add to Group
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">{isEditing ? 'Edit Audience Group' : 'Create Audience Group'}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">Group Name</label>
                                    <input type="text" className="form-control bg-light border-0" placeholder="e.g. High Value Investors" value={groupData.name} onChange={e => setGroupData({ ...groupData, name: e.target.value })} />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted">Description</label>
                                    <textarea className="form-control bg-light border-0" rows={2} placeholder="Leads interested in properties above $5M" value={groupData.description || ''} onChange={e => setGroupData({ ...groupData, description: e.target.value })}></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted">Associated Property Listing</label>
                                    <select
                                        className="form-select bg-light border-0"
                                        value={groupData.propertyId || groupData.listingId}
                                        onChange={e => setGroupData({ ...groupData, propertyId: e.target.value, listingId: e.target.value })}
                                    >
                                        <option value="">No property linked</option>
                                        {properties.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                    <div className="extra-small text-muted mt-2">Linking a listing helps identify the focus of this audience segment.</div>
                                </div>
                                <div className="form-check form-switch p-0 d-flex align-items-center gap-3 mb-4">
                                    <label className="form-check-label small fw-bold text-muted mb-0">Dynamic Group (Smart Segment)</label>
                                    <input className="form-check-input ms-0" type="checkbox" checked={groupData.isDynamic} onChange={e => setGroupData({ ...groupData, isDynamic: e.target.checked })} />
                                </div>

                                {!groupData.isDynamic && (
                                    <div className="lead-selector mt-4">
                                        <label className="form-label small fw-bold text-muted d-flex justify-content-between">
                                            Select Contacts <span>{groupData.leadIds.length} Selected</span>
                                        </label>
                                        <div className="input-group input-group-sm mb-2">
                                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
                                            <input type="text" className="form-control border-start-0" placeholder="Search contacts list..." value={leadSearchTerm} onChange={e => setLeadSearchTerm(e.target.value)} />
                                        </div>
                                        <div className="lead-list bg-light rounded-3 p-2 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {selectableLeads.map((lead: any) => (
                                                <div key={lead.id}
                                                    className={`d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 cursor-pointer transition-all ${groupData.leadIds.includes(lead.id) ? 'bg-success bg-opacity-10' : 'hover-bg-white'}`}
                                                    onClick={() => toggleLeadSelection(lead.id)}
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className={`avatar-xs rounded-circle d-flex align-items-center justify-content-center fw-bold extra-small ${groupData.leadIds.includes(lead.id) ? 'bg-success text-white' : 'bg-white text-primary border'}`} style={{ width: '24px', height: '24px' }}>
                                                            {lead.name.charAt(0)}
                                                        </div>
                                                        <div className="small fw-medium">{lead.name}</div>
                                                    </div>
                                                    {groupData.leadIds.includes(lead.id) && <i className="bi bi-check-circle-fill text-primary small"></i>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {groupData.isDynamic && (
                                    <div className="mt-3 p-3 bg-light rounded-3 border border-info border-opacity-25 border-dashed">
                                        <div className="extra-small text-info fw-bold mb-1"><i className="bi bi-info-circle me-1"></i>Smart Segmentation</div>
                                        <div className="extra-small text-muted">Dynamic groups automatically add leads based on real-time filters like budget, location, and property type.</div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                                <button className="btn btn-primary rounded-4 px-4 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={handleSave} disabled={!groupData.name || isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader size="sm" message="" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        isEditing ? 'Save Changes' : 'Create Group'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .group-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(0,0,0,0.05); }
                .group-card:hover { transform: translateY(-5px); border-color: rgba(var(--bs-primary-rgb), 0.3); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
                .extra-small { font-size: 0.75rem; }
            `}</style>
        </div>
    );
}
