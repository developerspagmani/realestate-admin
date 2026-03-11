'use client';

import React, { useState, useEffect } from 'react';
import { agentService, taskService, bookingService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import Link from 'next/link';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';

export default function AgentAttention() {
    const [loading, setLoading] = useState(true);
    const [staleLeads, setStaleLeads] = useState<any[]>([]);
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [staleBookings, setStaleBookings] = useState<any[]>([]);
    const { user } = useAuthContext();
    const { currencySymbol } = useManagementContext();

    useEffect(() => {
        loadAttentionItems();
    }, []);

    const loadAttentionItems = async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);

        try {
            // Get agent profile to ensure we have the correct agent ID
            const profileRes = await agentService.getMyProfile(token);
            const agentId = profileRes.success ? (profileRes.data?.agent?.id || profileRes.data?.id) : undefined;

            const [leadsRes, tasksRes, bookingsRes] = await Promise.all([
                agentService.getMyLeads(token),
                taskService.getMyTasks(),
                bookingService.getBookings(token, { agentId, limit: '100' })
            ]);

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            // 1. Pending tasks older than 2 days
            if (tasksRes.success && Array.isArray(tasksRes.data)) {
                setPendingTasks(tasksRes.data.filter((t: any) =>
                    t.status < 3 && new Date(t.createdAt) < twoDaysAgo
                ));
            }

            // 2. Leads not followed up in 2 days
            if (leadsRes.success && leadsRes.data.leads) {
                setStaleLeads(leadsRes.data.leads.filter((l: any) =>
                    l.status < 5 && new Date(l.updatedAt) < twoDaysAgo
                ));
            }

            // 3. Stale Bookings (Visiting customers)
            if (bookingsRes.success && (bookingsRes.data.bookings || bookingsRes.data)) {
                const bookings = bookingsRes.data.bookings || bookingsRes.data || [];
                setStaleBookings(bookings.filter((b: any) =>
                    b.status === 1 && new Date(b.createdAt) < twoDaysAgo
                ));
            }

        } catch (error) {
            console.error('Failed to load attention items', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1: return 'Pending';
            case 2: return 'In Progress';
            default: return 'Needs Action';
        }
    };

    const getTimeAgo = (date: string) => {
        const diff = new Date().getTime() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days === 0 ? 'Today' : `${days} days ago`;
    };

    return (
        <MainLayout activePage="attention">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">Attention Required</h2>
                        <p className="text-muted">High-priority items that haven't been touched in over 48 hours.</p>
                    </div>
                    <button className="btn btn-primary rounded-3 d-flex align-items-center gap-2" onClick={loadAttentionItems}>
                        <i className="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <Loader message="Analyzing your workflow..." />
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Tasks Section */}
                        <div className="col-12 col-xl-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                <div className="card-header bg-danger bg-opacity-10 border-0 p-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-danger text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-check2-square"></i>
                                        </div>
                                        <h5 className="fw-bold mb-0 text-danger">Pending Tasks</h5>
                                        <span className="badge bg-danger rounded-pill ms-auto">{pendingTasks.length}</span>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {pendingTasks.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {pendingTasks.map((task: any) => (
                                                <Link key={task.id} href="/realestate-agent/tasks" className="list-group-item list-group-item-action p-3 border-start-0 border-end-0 border-top-0">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-bold text-dark">{task.title}</span>
                                                        <span className="extra-small text-danger fw-bold">{getTimeAgo(task.createdAt)}</span>
                                                    </div>
                                                    <p className="small text-muted mb-0 text-truncate">{task.description || 'No description provided'}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-muted">
                                            <i className="bi bi-emoji-smile fs-2 d-block mb-2 text-success"></i>
                                            <p className="small mb-0">No pending tasks older than 2 days.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Leads Section */}
                        <div className="col-12 col-xl-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                <div className="card-header bg-warning bg-opacity-10 border-0 p-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-person-badge"></i>
                                        </div>
                                        <h5 className="fw-bold mb-0 text-dark">Stale Leads</h5>
                                        <span className="badge bg-warning text-dark rounded-pill ms-auto">{staleLeads.length}</span>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {staleLeads.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {staleLeads.map((lead: any) => (
                                                <Link key={lead.id} href={`/realestate-agent/leads?id=${lead.id}`} className="list-group-item list-group-item-action p-3 border-start-0 border-end-0 border-top-0">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-bold text-dark">{lead.name}</span>
                                                        <span className="extra-small text-danger fw-bold">{getTimeAgo(lead.updatedAt)}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-light text-muted border extra-small">Last: {new Date(lead.updatedAt).toLocaleDateString()}</span>
                                                        <span className="extra-small text-muted">{lead.email}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-muted">
                                            <i className="bi bi-check-circle fs-2 d-block mb-2 text-success"></i>
                                            <p className="small mb-0">All leads are currently followed up.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bookings Section */}
                        <div className="col-12 col-xl-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                <div className="card-header bg-dark bg-opacity-10 border-0 p-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-calendar-event"></i>
                                        </div>
                                        <h5 className="fw-bold mb-0 text-dark">Stale Bookings</h5>
                                        <span className="badge bg-primary rounded-pill ms-auto">{staleBookings.length}</span>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {staleBookings.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {staleBookings.map((booking: any) => (
                                                <Link key={booking.id} href="/realestate-agent/bookings" className="list-group-item list-group-item-action p-3 border-start-0 border-end-0 border-top-0">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="fw-bold text-dark">{booking.unit?.unitCode || 'Unit'} - {booking.guestName || 'Visits'}</span>
                                                        <span className="extra-small text-danger fw-bold">{getTimeAgo(booking.createdAt)}</span>
                                                    </div>
                                                    <p className="small text-muted mb-0">Status: {getStatusLabel(booking.status)} | {new Date(booking.startAt).toLocaleDateString()}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 text-center text-muted">
                                            <i className="bi bi-calendar-check fs-2 d-block mb-2 text-success"></i>
                                            <p className="small mb-0">No stale visiting requests.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .extra-small { font-size: 11px; }
            `}</style>
        </MainLayout>
    );
}
