'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { bookingService, agentService, getAuthToken, propertyService, unitService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import { Booking, Lead, Property, Unit, Agent } from '@/types';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import React from 'react';

export default function AgentBookingsManager() {
    const { user, isAuthenticated } = useAuthContext();
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agentProfile, setAgentProfile] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
    const [showModal, setShowModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [saving, setSaving] = useState(false);

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setViewModal(true);
    };

    const handleUpdateStatus = async (status: number) => {
        if (!selectedBooking) return;
        const token = getAuthToken();
        if (!token) return;

        setSaving(true);
        try {
            const res = await bookingService.updateBookingStatus(token, selectedBooking.id, status);
            if (res.success) {
                showToast('Status updated');
                setViewModal(false);
                loadData();
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        } finally {
            setSaving(false);
        }
    };

    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allUnits, setAllUnits] = useState<Unit[]>([]);

    const [formData, setFormData] = useState({
        leadId: '',
        propertyId: '',
        unitId: '',
        startAt: '',
        endAt: '',
        notes: '',
        guestName: '',
        guestEmail: '',
        guestPhone: ''
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadData = React.useCallback(async () => {
        const token = getAuthToken();
        if (!token) return;

        setLoading(true);
        try {
            // First get agent profile to get the agent ID
            const profileRes = await agentService.getMyProfile(token);
            let agentId = '';
            const agentData = profileRes.data?.agent || profileRes.data;
            if (profileRes.success && agentData) {
                setAgentProfile(agentData);
                agentId = agentData.id;
            }

            const [bookingsRes, leadsRes, propsRes, unitsRes] = await Promise.all([
                bookingService.getBookings(token, { agentId, limit: '100' }),
                agentService.getMyLeads(token),
                propertyService.getProperties(token, {}),
                unitService.getUnits(token, {})
            ]);

            if (bookingsRes.success) {
                setBookings(bookingsRes.data.bookings || bookingsRes.data || []);
            }
            if (leadsRes.success) {
                setLeads(leadsRes.data.leads || []);
            }
            if (propsRes.success) {
                setAllProperties(propsRes.data.properties || propsRes.data || []);
            }
            if (unitsRes.success) {
                setAllUnits(unitsRes.data.units || unitsRes.data || []);
            }
        } catch (error) {
            console.error('Failed to load agent bookings:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadData();
    }, [mounted, isAuthenticated, loadData, router]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const guestName = (b.guestName || b.user?.name || '').toLowerCase();
            const propertyName = (b.property?.title || b.unit?.property?.title || '').toLowerCase();
            const matchesSearch = guestName.includes(searchTerm.toLowerCase()) || propertyName.includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || b.status.toString() === filterStatus;
            
            let matchesTab = true;
            const now = new Date();
            const start = new Date(b.startAt);
            if (activeTab === 'upcoming') {
                matchesTab = start >= now && (b.status === 1 || b.status === 2);
            } else if (activeTab === 'past') {
                matchesTab = start < now || b.status === 4 || b.status === 3;
            }

            return matchesSearch && matchesStatus && matchesTab;
        });
    }, [bookings, searchTerm, filterStatus, activeTab]);

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token || !agentProfile) return;

        if (!formData.leadId && !formData.guestName) {
            showToast('Please select a lead or enter guest details', 'error');
            return;
        }

        setSaving(true);
        try {
            const start = new Date(formData.startAt);
            const end = formData.endAt ? new Date(formData.endAt) : new Date(start.getTime() + 60 * 60 * 1000);

            const payload = {
                ...formData,
                agentId: agentProfile.id,
                tenantId: agentProfile.tenantId,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
                status: 1 // Pending
            };

            const res = await bookingService.createBooking(token, payload);
            if (res.success) {
                showToast('Visit scheduled successfully');
                setShowModal(false);
                loadData();
            } else {
                showToast(res.message || 'Failed to schedule visit', 'error');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            showToast('Error creating booking', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-warning-subtle text-warning">Pending</span>;
            case 2: return <span className="badge bg-success-subtle text-success">Confirmed</span>;
            case 3: return <span className="badge bg-danger-subtle text-danger">Cancelled</span>;
            case 4: return <span className="badge bg-primary-subtle text-primary">Completed</span>;
            default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
        }
    };

    if (!mounted || !agentProfile) {
        return (
            <MainLayout activePage="bookings">
                <div className="container-fluid p-5 text-center">
                    <Loader message="Initializing agent portal..." />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="bookings">
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Lead Visits & Site Tours</h4>
                        <p className="text-muted small mb-0">Manage your scheduled property viewings with assigned leads</p>
                    </div>
                    <button className="btn btn-primary px-4 shadow-sm" onClick={() => setShowModal(true)}>
                        <i className="bi bi-calendar-plus me-2"></i>Schedule Visit
                    </button>
                </div>

                {/* Filters */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="input-group input-group-merge">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                                    <input 
                                        type="text" 
                                        className="form-control bg-light border-0" 
                                        placeholder="Search leads or properties..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-2">
                                <select 
                                    className="form-select bg-light border-0" 
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="1">Pending</option>
                                    <option value="2">Confirmed</option>
                                    <option value="4">Completed</option>
                                    <option value="3">Cancelled</option>
                                </select>
                            </div>
                            <div className="col-md-6 d-flex justify-content-end">
                                <div className="btn-group p-1 bg-light rounded-3">
                                    <button 
                                        className={`btn btn-sm px-3 ${activeTab === 'all' ? 'btn-white shadow-sm' : 'text-muted border-0'}`}
                                        onClick={() => setActiveTab('all')}
                                    >All</button>
                                    <button 
                                        className={`btn btn-sm px-3 ${activeTab === 'upcoming' ? 'btn-white shadow-sm' : 'text-muted border-0'}`}
                                        onClick={() => setActiveTab('upcoming')}
                                    >Upcoming</button>
                                    <button 
                                        className={`btn btn-sm px-3 ${activeTab === 'past' ? 'btn-white shadow-sm' : 'text-muted border-0'}`}
                                        onClick={() => setActiveTab('past')}
                                    >Past</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 py-3">Lead / Prospect</th>
                                        <th>Property / Unit</th>
                                        <th>Visit Date & Time</th>
                                        <th>Status</th>
                                        <th className="pe-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center py-5"><Loader size="sm" message="" /></td></tr>
                                    ) : filteredBookings.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-5 text-muted">No scheduled visits found.</td></tr>
                                    ) : (
                                        filteredBookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar rounded-circle bg-primary-subtle text-primary me-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                            {(booking.guestName || booking.user?.name || 'G').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">{booking.guestName || booking.user?.name || 'Guest'}</div>
                                                            <div className="small text-muted">{booking.guestEmail || booking.user?.email || 'No email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold">{booking.unit?.property?.title || booking.property?.title || 'Unknown'}</div>
                                                    <div className="text-muted small">Unit: {booking.unit?.unitCode || 'N/A'}</div>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark">{new Date(booking.startAt).toLocaleDateString()}</div>
                                                    <div className="small text-muted">{new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td>{getStatusBadge(booking.status)}</td>
                                                <td className="pe-4 text-end">
                                                    <button className="btn btn-sm btn-light border" onClick={() => handleViewDetails(booking)}>
                                                        Details
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

                {/* View Details Modal */}
                {viewModal && selectedBooking && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4 pb-0">
                                    <h5 className="modal-title fw-bold">Visit Details</h5>
                                    <button type="button" className="btn-close" onClick={() => setViewModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-4">
                                        <div className="avatar rounded-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px' }}>
                                            {(selectedBooking.guestName || selectedBooking.user?.name || 'G').charAt(0)}
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0">{selectedBooking.guestName || selectedBooking.user?.name || 'Guest'}</h6>
                                            <p className="text-muted small mb-0">{selectedBooking.guestEmail || selectedBooking.user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <label className="text-muted small text-uppercase fw-bold d-block mb-1">Date</label>
                                            <div className="fw-semibold">{new Date(selectedBooking.startAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-muted small text-uppercase fw-bold d-block mb-1">Time</label>
                                            <div className="fw-semibold">{new Date(selectedBooking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="text-muted small text-uppercase fw-bold d-block mb-1">Property</label>
                                            <div className="fw-semibold">{selectedBooking.unit?.property?.title || selectedBooking.property?.title}</div>
                                            {selectedBooking.unit && <div className="small text-muted">Unit: {selectedBooking.unit.unitCode}</div>}
                                        </div>
                                        {selectedBooking.notes && (
                                            <div className="col-12">
                                                <label className="text-muted small text-uppercase fw-bold d-block mb-1">Notes</label>
                                                <div className="p-2 bg-light rounded small">{selectedBooking.notes}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex gap-2">
                                        {selectedBooking.status === 1 && (
                                            <>
                                                <button className="btn btn-success flex-grow-1" onClick={() => handleUpdateStatus(2)} disabled={saving}>Confirm Visit</button>
                                                <button className="btn btn-outline-danger" onClick={() => handleUpdateStatus(3)} disabled={saving}>Cancel</button>
                                            </>
                                        )}
                                        {selectedBooking.status === 2 && (
                                            <>
                                                <button className="btn btn-primary flex-grow-1" onClick={() => handleUpdateStatus(4)} disabled={saving}>Mark as Completed</button>
                                                <button className="btn btn-outline-danger" onClick={() => handleUpdateStatus(3)} disabled={saving}>Cancel Visit</button>
                                            </>
                                        )}
                                        {selectedBooking.status > 2 && (
                                            <button className="btn btn-light w-100" disabled>Visit {selectedBooking.status === 3 ? 'Cancelled' : 'Completed'}</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Booking Modal */}
                {showModal && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4">
                                    <h5 className="modal-title fw-bold">Schedule New Visit</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleCreateBooking}>
                                    <div className="modal-body p-4">
                                        <div className="row g-3">
                                            {/* Lead Selection */}
                                            <div className="col-md-12">
                                                <label className="form-label small fw-bold text-uppercase">Assigned Lead</label>
                                                <select 
                                                    className="form-select border-0 bg-light" 
                                                    value={formData.leadId}
                                                    onChange={e => {
                                                        const lead = leads.find(l => l.id === e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            leadId: e.target.value,
                                                            guestName: lead?.name || '',
                                                            guestEmail: lead?.email || '',
                                                            guestPhone: lead?.phone || '',
                                                            propertyId: lead?.propertyId || '',
                                                            unitId: lead?.unitId || ''
                                                        });
                                                    }}
                                                >
                                                    <option value="">-- Select Lead --</option>
                                                    {leads.map(l => (
                                                        <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                                                    ))}
                                                </select>
                                                <div className="small text-muted mt-1">If not listed, fill guest details below manually.</div>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold text-uppercase">Guest Name</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control border-0 bg-light" 
                                                    value={formData.guestName}
                                                    onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                                    required={!formData.leadId}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold text-uppercase">Guest Email</label>
                                                <input 
                                                    type="email" 
                                                    className="form-control border-0 bg-light" 
                                                    value={formData.guestEmail}
                                                    onChange={e => setFormData({ ...formData, guestEmail: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold text-uppercase">Guest Phone</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control border-0 bg-light" 
                                                    value={formData.guestPhone}
                                                    onChange={e => setFormData({ ...formData, guestPhone: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-uppercase">Property</label>
                                                <select 
                                                    className="form-select border-0 bg-light" 
                                                    value={formData.propertyId}
                                                    onChange={e => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
                                                    required
                                                >
                                                    <option value="">-- Select Property --</option>
                                                    {allProperties.map(p => (
                                                        <option key={p.id} value={p.id}>{p.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-uppercase">Unit (Optional)</label>
                                                <select 
                                                    className="form-select border-0 bg-light" 
                                                    value={formData.unitId}
                                                    onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                                                >
                                                    <option value="">-- Select Unit --</option>
                                                    {allUnits.filter(u => u.propertyId === formData.propertyId).map(u => (
                                                        <option key={u.id} value={u.id}>{u.unitCode}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-uppercase">Visit Start Date & Time</label>
                                                <input 
                                                    type="datetime-local" 
                                                    className="form-control border-0 bg-light" 
                                                    value={formData.startAt}
                                                    onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-uppercase">Estimated End Time</label>
                                                <input 
                                                    type="datetime-local" 
                                                    className="form-control border-0 bg-light" 
                                                    value={formData.endAt}
                                                    onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-uppercase">Visit Notes</label>
                                                <textarea 
                                                    className="form-control border-0 bg-light" 
                                                    rows={3}
                                                    value={formData.notes}
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                    placeholder="Enter any special requirements or notes for this viewing..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 pt-0">
                                        <button type="button" className="btn btn-light rounded-3" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-4 rounded-3" disabled={saving}>
                                            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Scheduling...</> : 'Schedule Visit'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
