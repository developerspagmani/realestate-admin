'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

interface AudienceManagerProps {
    tenantId: string;
}

export default function AudienceManager({ tenantId }: AudienceManagerProps) {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [groupData, setGroupData] = useState({
        name: '',
        description: '',
        isDynamic: false
    });

    const loadGroups = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.getAudienceGroups(token, { tenantId });
            if (res.success) {
                setGroups(res.data);
            }
        } catch (error) {
            console.error('Failed to load audience groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, [tenantId]);

    const handleSave = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            let res;
            if (isEditing && currentGroupId) {
                res = await marketingService.updateAudienceGroup(token, currentGroupId, { ...groupData, tenantId });
            } else {
                res = await marketingService.createAudienceGroup(token, { ...groupData, tenantId });
            }

            if (res.success) {
                setShowModal(false);
                loadGroups();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save group:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will not delete the leads themselves.`)) return;

        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.deleteAudienceGroup(token, id);
            if (res.success) {
                loadGroups();
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const openEdit = (group: any) => {
        setGroupData({
            name: group.name,
            description: group.description || '',
            isDynamic: group.isDynamic
        });
        setCurrentGroupId(group.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setGroupData({ name: '', description: '', isDynamic: false });
        setIsEditing(false);
        setCurrentGroupId(null);
    };

    return (
        <div className="audience-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Audience Groups</h5>
                <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => { resetForm(); setShowModal(true); }}>
                    <i className="bi bi-person-plus me-1"></i> New Group
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : groups.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50">
                    <i className="bi bi-people display-4 text-muted opacity-25 mb-3"></i>
                    <h6 className="fw-bold">Build Your Audience</h6>
                    <p className="text-muted small">Organize your leads into groups or smart segments for targeted marketing.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {groups.map(group => (
                        <div key={group.id} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 group-card">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className={`p-3 rounded-4 ${group.isDynamic ? 'bg-info text-info' : 'bg-primary text-primary'} bg-opacity-10`}>
                                        <i className={`bi ${group.isDynamic ? 'bi-lightning-charge-fill' : 'bi-people-fill'} fs-4`}></i>
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn btn-link btn-sm p-0 text-muted" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                            <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => openEdit(group)}><i className="bi bi-pencil"></i> Edit Details</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item small text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(group.id, group.name)}><i className="bi bi-trash"></i> Delete Group</button></li>
                                        </ul>
                                    </div>
                                </div>
                                <h6 className="fw-bold mb-1">{group.name}</h6>
                                <p className="text-muted small mb-4 lh-sm">{group.description || 'No description provided.'}</p>

                                <div className="mt-auto d-flex justify-content-between align-items-center">
                                    <div className="text-muted extra-small">
                                        <span className="fw-bold text-dark">{group._count?.leads || 0}</span> Members
                                    </div>
                                    {group.isDynamic && <span className="badge bg-info bg-opacity-10 text-info border-info border-opacity-25 extra-small">Smart Segment</span>}
                                </div>
                            </div>
                        </div>
                    ))}
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
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">Description</label>
                                    <textarea className="form-control bg-light border-0" rows={2} placeholder="Leads interested in properties above $5M" value={groupData.description} onChange={e => setGroupData({ ...groupData, description: e.target.value })}></textarea>
                                </div>
                                <div className="form-check form-switch p-0 d-flex align-items-center gap-3">
                                    <label className="form-check-label small fw-bold text-muted mb-0">Dynamic Group (Smart Segment)</label>
                                    <input className="form-check-input ms-0" type="checkbox" checked={groupData.isDynamic} onChange={e => setGroupData({ ...groupData, isDynamic: e.target.checked })} />
                                </div>
                                {groupData.isDynamic && (
                                    <div className="mt-3 p-3 bg-light rounded-3 border border-info border-opacity-25 border-dashed">
                                        <div className="extra-small text-info fw-bold mb-1"><i className="bi bi-info-circle me-1"></i>Smart Segmentation</div>
                                        <div className="extra-small text-muted">Dynamic groups automatically add leads based on real-time filters like budget, location, and property type.</div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={handleSave} disabled={!groupData.name}>
                                    {isEditing ? 'Save Changes' : 'Create Group'}
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
