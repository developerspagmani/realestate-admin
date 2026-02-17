'use client';

import React, { useState } from 'react';
import { Lead } from './LeadsManager';

interface LeadsKanbanProps {
    leads: Lead[];
    onStatusChange: (id: string, newStatus: Lead['status']) => void;
    onConvertToUser: (lead: Lead) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (id: string) => void;
    onViewInsights: (lead: Lead) => void;
    isStale: (lead: Lead) => boolean;
}

const COLUMNS: { id: Lead['status']; title: string; color: string }[] = [
    { id: 'new', title: 'New Leads', color: '#0d6efd' },
    { id: 'contacted', title: 'Contacted', color: '#0dcaf0' },
    { id: 'qualified', title: 'Qualified', color: '#ffc107' },
    { id: 'converted', title: 'Converted', color: '#198754' },
    { id: 'lost', title: 'Lost', color: '#dc3545' }
];

export default function LeadsKanban({ leads, onStatusChange, onConvertToUser, onEdit, onDelete, onViewInsights, isStale }: LeadsKanbanProps) {
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [activeDropColumn, setActiveDropColumn] = useState<Lead['status'] | null>(null);
    const [animationLead, setAnimationLead] = useState<{ id: string, type: 'blast' | 'shake' } | null>(null);

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.setData('leadId', leadId);
        e.dataTransfer.effectAllowed = 'move';

        // Add a ghost effect or class if needed
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedLeadId(null);
    };

    const handleDragOver = (e: React.DragEvent, status: Lead['status']) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (activeDropColumn !== status) {
            setActiveDropColumn(status);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only reset if we're not entering a child element
        if (e.currentTarget === e.target) {
            setActiveDropColumn(null);
        }
    };

    const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
        e.preventDefault();
        setActiveDropColumn(null);
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) {
            if (status === 'converted') {
                setAnimationLead({ id: leadId, type: 'blast' });
                setTimeout(() => setAnimationLead(null), 1000);
            } else if (status === 'lost') {
                setAnimationLead({ id: leadId, type: 'shake' });
                setTimeout(() => setAnimationLead(null), 1000);
            }
            onStatusChange(leadId, status);
        }
    };

    const getSourceIcon = (source: Lead['source']) => {
        switch (source) {
            case 'website': return <i className="bi bi-globe text-primary"></i>;
            case 'email': return <i className="bi bi-envelope text-info"></i>;
            case 'phone': return <i className="bi bi-telephone text-success"></i>;
            case 'social': return <i className="bi bi-share text-secondary"></i>;
            case 'referral': return <i className="bi bi-people text-warning"></i>;
            case 'chatbot': return <i className="bi bi-chat-dots text-primary"></i>;
            default: return <i className="bi bi-question-circle text-muted"></i>;
        }
    };

    return (
        <div className="kanban-wrapper">
            <div className="kanban-container pb-4">
                <div className="d-flex flex-nowrap gap-4 px-2" style={{ minHeight: 'calc(100vh - 350px)' }}>
                    {COLUMNS.map(column => {
                        const columnLeads = leads.filter(l => l.status === column.id);
                        const totalBudget = columnLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

                        return (
                            <div
                                key={column.id}
                                className={`kanban-col-wrapper ${activeDropColumn === column.id ? 'active-drop' : ''}`}
                                style={{ minWidth: '320px', flex: '0 0 auto' }}
                            >
                                <div
                                    className={`kanban-column rounded-4 p-3 h-100 ${activeDropColumn === column.id ? 'bg-column-active' : ''}`}
                                    onDragOver={(e) => handleDragOver(e, column.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                    style={{ backgroundColor: '#f8f9fa', border: '1px solid #eee' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: column.color }}></div>
                                            <h6 className="fw-bold mb-0 text-dark">{column.title}</h6>
                                            <span className="badge rounded-4 bg-white text-dark border small">{columnLeads.length}</span>
                                        </div>
                                        {totalBudget > 0 && (
                                            <div className="small text-muted fw-medium">
                                                ${totalBudget.toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="kanban-cards d-flex flex-column gap-3">
                                        {columnLeads.length === 0 ? (
                                            <div className="text-center py-4 border border-dashed rounded-3 text-muted small" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                                No leads here
                                            </div>
                                        ) : (
                                            columnLeads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    className={`kanban-card card border-0 shadow-sm rounded-3 cursor-grab ${animationLead?.id === lead.id ? (animationLead.type === 'blast' ? 'animate-blast' : 'animate-shake') : ''}`}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => onViewInsights(lead)}
                                                >
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                {getSourceIcon(lead.source)}
                                                                <div className={`badge rounded-4 px-2 py-0 small ${lead.priority === 3 ? 'bg-danger-soft text-danger' : lead.priority === 2 ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'}`}>
                                                                    {lead.priority === 3 ? 'High' : lead.priority === 2 ? 'Med' : 'Low'}
                                                                </div>
                                                            </div>
                                                            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                                                <button className="btn btn-link btn-sm text-muted p-0 border-0" data-bs-toggle="dropdown">
                                                                    <i className="bi bi-three-dots-vertical"></i>
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 small">
                                                                    <li><button className="dropdown-item" onClick={() => onEdit(lead)}><i className="bi bi-pencil me-2"></i>Edit</button></li>
                                                                    <li><button className="dropdown-item" onClick={() => onViewInsights(lead)}><i className="bi bi-graph-up me-2"></i>Insights</button></li>
                                                                    {lead.status === 'converted' && (
                                                                        <>
                                                                            <li><hr className="dropdown-divider" /></li>
                                                                            <li>
                                                                                <button className="dropdown-item text-primary fw-bold" onClick={() => onConvertToUser(lead)}>
                                                                                    <i className="bi bi-person-plus-fill me-2"></i>Convert to User
                                                                                </button>
                                                                            </li>
                                                                        </>
                                                                    )}
                                                                    <li><hr className="dropdown-divider" /></li>
                                                                    {COLUMNS.filter(c => c.id !== column.id).map(c => (
                                                                        <li key={c.id}>
                                                                            <button className="dropdown-item" onClick={() => {
                                                                                if (c.id === 'converted') {
                                                                                    setAnimationLead({ id: lead.id, type: 'blast' });
                                                                                    setTimeout(() => setAnimationLead(null), 1000);
                                                                                } else if (c.id === 'lost') {
                                                                                    setAnimationLead({ id: lead.id, type: 'shake' });
                                                                                    setTimeout(() => setAnimationLead(null), 1000);
                                                                                }
                                                                                onStatusChange(lead.id, c.id);
                                                                            }}>
                                                                                Move to {c.title}
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                    <li><hr className="dropdown-divider" /></li>
                                                                    <li><button className="dropdown-item text-danger" onClick={() => onDelete(lead.id)}><i className="bi bi-trash me-2"></i>Delete</button></li>
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        <h6 className="fw-bold mb-1 text-dark text-truncate d-flex align-items-center gap-2">
                                                            {lead.name}
                                                            {isStale(lead) && (
                                                                <div className="pulse-danger" title="Stale lead: No activity for 3+ days"></div>
                                                            )}
                                                        </h6>
                                                        <p className="small text-muted mb-2 text-truncate">{lead.company || 'Private Lead'}</p>
                                                        <div className="d-flex flex-wrap gap-1 mb-2">
                                                            {lead.tags?.map(tag => (
                                                                <span key={tag} className="badge bg-primary bg-opacity-10 text-primary border-primary border-opacity-10 rounded-4 extra-small-badge" style={{ fontSize: '0.65rem' }}>
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {lead.status === 'converted' && (
                                                            <div className="mt-3">
                                                                <button
                                                                    className="btn btn-primary btn-sm w-100 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 py-2 fw-bold"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={(e) => { e.stopPropagation(); onConvertToUser(lead); }}
                                                                >
                                                                    <i className="bi bi-person-plus-fill"></i>
                                                                    <span>Convert to User</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                                            <div className="d-flex align-items-center gap-1">
                                                                <div className="lead-score-box rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        fontSize: '10px',
                                                                        backgroundColor: lead.leadScore > 50 ? '#dc3545' : lead.leadScore > 20 ? '#ffc107' : '#198754'
                                                                    }}>
                                                                    {lead.leadScore}
                                                                </div>
                                                                <i className="bi bi-magic text-primary ms-1" style={{ fontSize: '0.7rem' }}></i>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                {lead.assignedAgent ? (
                                                                    <div className="agent-avatar" title={lead.assignedAgent.user?.name}>
                                                                        <div className="avatar-xs bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                                            {(lead.assignedAgent.user?.name || 'A').charAt(0)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <i className="bi bi-person-dash text-muted" title="Unassigned"></i>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <style jsx>{`
                .kanban-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    overflow-y: visible;
                    border-radius: 1rem;
                    background: rgba(0,0,0,0.01);
                    scrollbar-width: auto;
                    scrollbar-color: #000000 #f1f3f5;
                    padding-bottom: 20px; /* More space for scrollbar */
                    margin-bottom: 10px;
                }
                .kanban-wrapper::-webkit-scrollbar {
                    height: 12px;
                }
                .kanban-wrapper::-webkit-scrollbar-track {
                    background: #f1f3f5;
                    border-radius: 10px;
                }
                .kanban-wrapper::-webkit-scrollbar-thumb {
                    background: #000000;
                    border-radius: 10px;
                    border: 3px solid #f1f3f5;
                }
                .kanban-wrapper::-webkit-scrollbar-thumb:hover {
                    background: #333333;
                }
                .kanban-container {
                    display: table; /* Force container to respect children width */
                    min-width: 100%;
                }
                .cursor-grab {
                    cursor: grab;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .cursor-grab:active {
                    cursor: grabbing;
                }
                .kanban-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                
                .kanban-column {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .bg-column-active {
                    background-color: #f1f3f5 !important;
                    border-color: #0d6efd !important;
                    transform: scale(1.01);
                }
                .kanban-col-wrapper {
                    transition: padding 0.2s ease;
                }
                .active-drop {
                    padding-top: 5px;
                }
                .border-dashed {
                    border-style: dashed !important;
                }

                /* Transitions */
                .kanban-card {
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Blast Animation (Converted) */
                .animate-blast {
                    animation: blastEffect 0.8s cubic-bezier(0.1, 0.9, 0.2, 1);
                    z-index: 10;
                }

                @keyframes blastEffect {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); }
                    30% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(25, 135, 84, 0); }
                    50% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }

                /* Shake Animation (Lost) */
                .animate-shake {
                    animation: shakeEffect 0.5s cubic-bezier(.36,.07,.19,.97) both;
                    filter: grayscale(0.5);
                }

                @keyframes shakeEffect {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                /* Particle simulation via box-shadow for blast */
                .animate-blast::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    pointer-events: none;
                    box-shadow: 
                        -50px -50px #198754, 50px -50px #ffc107, 
                        -50px 50px #0dcaf0, 50px 50px #0d6efd,
                        0 -70px #198754, 0 70px #ffc107,
                        70px 0 #0dcaf0, -70px 0 #0d6efd;
                    opacity: 0;
                    animation: particles 0.8s ease-out;
                }

                @keyframes particles {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }

                .pulse-danger {
                    width: 8px;
                    height: 8px;
                    background-color: #dc3545;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
                    animation: pulse-red 2s infinite;
                }

                @keyframes pulse-red {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(220, 53, 69, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .extra-small-badge { font-size: 0.6rem; padding: 0.2rem 0.5rem; letter-spacing: 0.5px; }
            `}</style>
            </div>
        </div>
    );
}
