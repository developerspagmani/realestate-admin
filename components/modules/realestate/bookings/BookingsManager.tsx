'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { bookingService, userService, unitService, propertyService, agentService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import { Booking, User, Unit, Property } from '@/app/services/api';
import Toast from '@/components/common/Toast';

interface BookingsManagerProps {
    mode: 'admin' | 'owner';
}

export default function BookingsManager({ mode }: BookingsManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState<any>({
        userId: '',
        unitId: '',
        propertyId: '',
        startAt: '',
        endAt: '',
        status: 1, // pending
        paymentStatus: 1, // pending
        notes: '',
        specialRequests: '',
        agentId: ''
    });

    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'past'>('all');
    const [availabilityStatus, setAvailabilityStatus] = useState<{ loading: boolean; available?: boolean; conflicts?: any[]; price?: number }>({ loading: false });
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [availabilityForm, setAvailabilityForm] = useState({ propertyId: '', unitId: '', startAt: '', endAt: '' });
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();
    const searchParams = useSearchParams();
    const urlPropertyId = searchParams.get('propertyId');
    const urlUnitId = searchParams.get('unitId');

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const params: any = {
                tenantId,
                ...(mode === 'admin' && activeOwnerId ? { ownerId: activeOwnerId } : {})
            };
            if (urlUnitId) params.unitId = urlUnitId;

            const [bookingsRes, usersRes, propertiesRes, unitsRes, agentsRes] = await Promise.all([
                bookingService.getBookings(token, {
                    ...params,
                    industryType
                }),
                userService.getUsers(token, { tenantId: tenantId || undefined }),
                propertyService.getProperties(token, {
                    tenantId: tenantId || undefined,
                    industryType,
                    ...(mode === 'admin' && activeOwnerId ? { ownerId: activeOwnerId } : {})
                }),
                unitService.getUnits(token, {
                    tenantId: tenantId || undefined,
                    industryType,
                    ...(mode === 'admin' && activeOwnerId ? { ownerId: activeOwnerId } : {})
                }),
                agentService.getAgents(token, { tenantId: tenantId || undefined })
            ]);

            if (bookingsRes.success) setBookings(bookingsRes.data.bookings || bookingsRes.data || []);
            if (usersRes.success) setUsers(usersRes.data.users || usersRes.data || []);
            if (propertiesRes.success) setProperties(propertiesRes.data.properties || propertiesRes.data || []);
            if (unitsRes.success) setUnits(unitsRes.data.units || unitsRes.data || []);
            if (agentsRes && (agentsRes as any).success) setAgents((agentsRes as any).data.agents || (agentsRes as any).data || []);

        } catch (error) {
            console.error('Failed to load bookings data:', error);
            showToast('Failed to load bookings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [mounted, isAuthenticated, user, router, urlUnitId, activeTenantId, activeOwnerId, tenantType]);

    const formatForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const userName = booking.user?.name?.toLowerCase() || '';
            const unitCode = booking.unit?.unitCode?.toLowerCase() || '';
            const propertyTitle = booking.unit?.property?.title?.toLowerCase() || '';

            const matchesSearch =
                userName.includes(searchTerm.toLowerCase()) ||
                unitCode.includes(searchTerm.toLowerCase()) ||
                propertyTitle.includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || booking.status.toString() === filterStatus;

            let matchesTab = true;
            const now = new Date();
            const end = new Date(booking.endAt);

            if (activeTab === 'pending') {
                matchesTab = booking.status === 1;
            } else if (activeTab === 'confirmed') {
                matchesTab = booking.status === 2 && end >= now;
            } else if (activeTab === 'past') {
                matchesTab = booking.status === 4 || booking.status === 3 || (booking.status === 2 && end < now);
            }

            return matchesSearch && matchesStatus && matchesTab;
        });
    }, [bookings, searchTerm, filterStatus, activeTab]);

    const checkAvailability = async (isManual: boolean = false) => {
        const targetForm = isManual ? availabilityForm : formData;
        if (!targetForm.unitId || !targetForm.startAt || !targetForm.endAt) return;

        try {
            setAvailabilityStatus({ loading: true });
            const token = getAuthToken();
            if (!token) return;

            const params: any = {
                unitId: targetForm.unitId,
                startAt: new Date(targetForm.startAt).toISOString(),
                endAt: new Date(targetForm.endAt).toISOString(),
            };

            if (!isManual && editingBooking) {
                params.bookingId = editingBooking.id;
            }

            const res = await bookingService.checkAvailability(token, params);
            setAvailabilityStatus({
                loading: false,
                available: res.available,
                conflicts: res.conflicts,
                price: res.estimatedPrice
            });
        } catch (error) {
            console.error('Check availability error:', error);
            setAvailabilityStatus({ loading: false });
        }
    };

    useEffect(() => {
        if (formData.unitId && formData.startAt && formData.endAt) {
            const timer = setTimeout(() => checkAvailability(false), 500);
            return () => clearTimeout(timer);
        } else {
            setAvailabilityStatus({ loading: false });
        }
    }, [formData.unitId, formData.startAt, formData.endAt]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            if (!token) return;

            const payload = {
                ...formData,
                tenantId: (user as any)?.tenantId || localStorage.getItem('tenant-id'),
                startAt: new Date(formData.startAt).toISOString(),
                endAt: new Date(formData.endAt).toISOString(),
            };

            let response;
            if (editingBooking) {
                response = await bookingService.updateBooking(token, editingBooking.id, payload);
            } else {
                response = await bookingService.createBooking(token, payload);
            }

            if (response.success) {
                setShowModal(false);
                setEditingBooking(null);
                loadData();
                showToast(editingBooking ? 'Booking updated successfully' : 'Booking created successfully');
            } else {
                showToast(response.message || 'Failed to save booking', 'error');
            }
        } catch (error) {
            console.error('Error saving booking:', error);
            showToast('Error saving booking', 'error');
        }
    };

    const handleStatusChange = async (id: string, status: number) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const response = await bookingService.updateBookingStatus(token, id, status);
            if (response.success) {
                loadData();
                showToast('Booking status updated');
            } else {
                showToast(response.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Error updating status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const response = await bookingService.deleteBooking(token, id);
            if (response.success) {
                loadData();
                showToast('Booking deleted successfully');
            } else {
                showToast(response.message || 'Failed to delete booking', 'error');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            showToast('Error deleting booking', 'error');
        }
    };

    const getStatusLabel = (status: number) => {
        const config: any = {
            1: { label: 'Pending', class: 'bg-warning-soft text-warning', icon: 'bi-clock' },
            2: { label: 'Confirmed', class: 'bg-success-soft text-success', icon: 'bi-check-circle' },
            3: { label: 'Cancelled', class: 'bg-danger-soft text-danger', icon: 'bi-x-circle' },
            4: { label: 'Completed', class: 'bg-primary-soft text-primary', icon: 'bi-flag' },
            5: { label: 'No Show', class: 'bg-secondary-soft text-secondary', icon: 'bi-person-x' }
        };
        return config[status] || { label: 'Unknown', class: 'bg-light text-muted', icon: 'bi-question' };
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            unitId: '',
            propertyId: '',
            startAt: '',
            endAt: '',
            status: 1,
            paymentStatus: 1,
            notes: '',
            specialRequests: '',
            agentId: ''
        });
        setEditingBooking(null);
        setShowModal(false);
    };

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="bookings">
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
            <div className="container-fluid py-4">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">{mode === 'admin' ? 'Booking Invitations' : 'My Reservations'}</h2>
                        <p className="text-muted small mb-0">Manage guest bookings and space reservations</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                            onClick={() => {
                                setAvailabilityStatus({ loading: false });
                                setAvailabilityForm({ propertyId: '', unitId: '', startAt: '', endAt: '' });
                                setShowAvailabilityModal(true);
                            }}
                        >
                            <i className="bi bi-search"></i>
                            <span>Check Availability</span>
                        </button>
                        <button
                            className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <i className="bi bi-calendar-plus-fill"></i>
                            <span>Create Booking</span>
                        </button>
                    </div>
                </div>

                {/* Tabs Control */}
                <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                    <div className="card-body p-1">
                        <ul className="nav nav-pills nav-fill">
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 py-2 ${activeTab === 'all' ? 'active' : 'text-muted'}`}
                                    onClick={() => setActiveTab('all')}
                                >
                                    <i className="bi bi-grid-fill me-2"></i> All Bookings
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 py-2 ${activeTab === 'pending' ? 'active' : 'text-muted'}`}
                                    onClick={() => setActiveTab('pending')}
                                >
                                    <i className="bi bi-clock-history me-2"></i> Pending
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 py-2 ${activeTab === 'confirmed' ? 'active' : 'text-muted'}`}
                                    onClick={() => setActiveTab('confirmed')}
                                >
                                    <i className="bi bi-calendar-check me-2"></i> Active & Upcoming
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 py-2 ${activeTab === 'past' ? 'active' : 'text-muted'}`}
                                    onClick={() => setActiveTab('past')}
                                >
                                    <i className="bi bi-archive me-2"></i> Past Bookings
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="card border-0 shadow-sm mb-3 rounded-4 overflow-hidden">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-7">
                                <div className="input-group input-group-merge">
                                    <span className="input-group-text bg-light border-0 px-3">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 ps-0"
                                        placeholder="Search by name, property, unit..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-5 d-flex align-items-center justify-content-end gap-3">
                                <select
                                    className="form-select border-0 bg-light w-auto"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">Status: All</option>
                                    <option value="1">Pending</option>
                                    <option value="2">Confirmed</option>
                                    <option value="3">Cancelled</option>
                                    <option value="4">Completed</option>
                                </select>
                                <div className="vr h-50 mx-2"></div>
                                <span className="text-primary fw-bold">
                                    {filteredBookings.length} <span className="text-muted fw-normal">Matches</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted">Guest Details</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted">Property & Unit</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted">Schedule</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted">Financials</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted">Agent</th>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </td>
                                    </tr>
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <i className="bi bi-calendar-x display-4 text-muted mb-3 d-block"></i>
                                            <p className="text-muted">No reservations found matching your criteria</p>
                                        </td>
                                    </tr>
                                ) : filteredBookings.map((booking) => {
                                    const status = getStatusLabel(booking.status);
                                    return (
                                        <tr key={booking.id} className="cursor-pointer" onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                        {booking.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{booking.user?.name || 'Unknown User'}</div>
                                                        <div className="text-muted small">{booking.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-semibold text-dark">{booking.unit?.property?.title || 'Unknown Property'}</div>
                                                <div className="badge bg-light text-dark fw-normal border">
                                                    <i className="bi bi-door-open me-1 text-primary"></i>
                                                    {booking.unit?.unitCode || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-semibold text-dark">
                                                    {new Date(booking.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="text-muted small">
                                                    {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(booking.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-bold text-dark">${booking.totalPrice || '0.00'}</div>
                                                <div className={`small ${booking.paymentStatus === 2 ? 'text-success' : 'text-warning'}`}>
                                                    {booking.paymentStatus === 2 ? 'Paid' : 'Unpaid'}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className={`badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 ${status.class}`}>
                                                    <i className={`bi ${status.icon}`}></i>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                {booking.agent ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                            {booking.agent.user?.name?.charAt(0) || 'A'}
                                                        </div>
                                                        <div className="small fw-semibold">{booking.agent.user?.name || 'Agent'}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">Direct</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                                    <button className="btn btn-icon btn-light border-0 rounded-circle" data-bs-toggle="dropdown">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                                                        <li><h6 className="dropdown-header small text-uppercase fw-bold text-muted">Manage Status</h6></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(booking.id, 2)}><i className="bi bi-check-circle text-success"></i> Confirm</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(booking.id, 4)}><i className="bi bi-flag text-primary"></i> Complete</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(booking.id, 3)}><i className="bi bi-x-circle text-danger"></i> Cancel</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2 text-primary" onClick={() => {
                                                            setEditingBooking(booking);
                                                            setFormData({
                                                                userId: booking.userId,
                                                                unitId: booking.unitId,
                                                                propertyId: booking.unit?.property?.id || booking.unit?.propertyId,
                                                                startAt: booking.startAt,
                                                                endAt: booking.endAt,
                                                                status: booking.status,
                                                                paymentStatus: booking.paymentStatus,
                                                                notes: booking.notes || '',
                                                                specialRequests: booking.specialRequests || '',
                                                                agentId: booking.agentId || ''
                                                            });
                                                            setShowModal(true);
                                                        }}><i className="bi bi-pencil-square"></i> Edit Details</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={() => handleDelete(booking.id)}><i className="bi bi-trash-fill"></i> Delete</button></li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">{editingBooking ? 'Update Reservation' : 'New Guest Reservation'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Select Guest</label>
                                            <select
                                                className="form-select form-select-lg bg-light border-0"
                                                value={formData.userId}
                                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                                required
                                            >
                                                <option value="">Choose a user...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Assigned Agent</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.agentId}
                                                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                                            >
                                                <option value="">No Agent (Direct)</option>
                                                {agents.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.user?.name || `${a.user?.firstName} ${a.user?.lastName}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Property</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.propertyId}
                                                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: '' })}
                                                required
                                            >
                                                <option value="">Select Property...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Workspace / Unit</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.unitId}
                                                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                                required
                                                disabled={!formData.propertyId}
                                            >
                                                <option value="">Select Unit...</option>
                                                {units
                                                    .filter(u => u.propertyId === formData.propertyId)
                                                    .map(u => <option key={u.id} value={u.id}>{u.unitCode}</option>)}
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Check-in Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-light border-0"
                                                value={formatForInput(formData.startAt)}
                                                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Check-out Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-light border-0"
                                                value={formatForInput(formData.endAt)}
                                                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Special Requests / Notes</label>
                                            <textarea
                                                className="form-control bg-light border-0"
                                                rows={3}
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Any special requirements for this booking..."
                                            ></textarea>
                                        </div>

                                        <div className="col-md-12">
                                            <div className={`p-3 rounded-3 border-0 shadow-none ${availabilityStatus.loading ? 'bg-light' :
                                                availabilityStatus.available === true ? 'bg-success-soft' :
                                                    availabilityStatus.available === false ? 'bg-danger-soft' : 'bg-light'
                                                }`}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {availabilityStatus.loading ? (
                                                            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                        ) : availabilityStatus.available === true ? (
                                                            <i className="bi bi-check-circle-fill text-success"></i>
                                                        ) : availabilityStatus.available === false ? (
                                                            <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                                                        ) : (
                                                            <i className="bi bi-info-circle text-muted"></i>
                                                        )}
                                                        <span className="fw-bold">
                                                            {availabilityStatus.loading ? 'Checking Availability...' :
                                                                availabilityStatus.available === true ? 'Unit is Available' :
                                                                    availabilityStatus.available === false ? 'Dates Conflict' : 'Select Unit & Dates'}
                                                        </span>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="text-muted small d-block">Estimated Total</span>
                                                        <span className="h4 fw-bold mb-0 text-primary">${availabilityStatus.price || '0.00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={resetForm}>Discard</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4 fw-bold shadow-sm"
                                        disabled={availabilityStatus.available === false || availabilityStatus.loading}
                                    >
                                        {editingBooking ? 'Save Updates' : 'Confirm Reservation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Availability Tool Modal */}
            {showAvailabilityModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">Availability Checker</h4>
                                <button type="button" className="btn-close" onClick={() => setShowAvailabilityModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Property</label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={availabilityForm.propertyId}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, propertyId: e.target.value, unitId: '' })}
                                        >
                                            <option value="">Select Property...</option>
                                            {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Unit</label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={availabilityForm.unitId}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, unitId: e.target.value })}
                                            disabled={!availabilityForm.propertyId}
                                        >
                                            <option value="">Select Unit...</option>
                                            {units
                                                .filter(u => u.propertyId === availabilityForm.propertyId)
                                                .map(u => <option key={u.id} value={u.id}>{u.unitCode}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-uppercase text-muted">From</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control bg-light border-0"
                                            value={availabilityForm.startAt}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, startAt: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-uppercase text-muted">To</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control bg-light border-0"
                                            value={availabilityForm.endAt}
                                            onChange={(e) => setAvailabilityForm({ ...availabilityForm, endAt: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-12 mt-4">
                                        <button
                                            className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-none"
                                            disabled={!availabilityForm.unitId || !availabilityForm.startAt || !availabilityForm.endAt || availabilityStatus.loading}
                                            onClick={() => checkAvailability(true)}
                                        >
                                            {availabilityStatus.loading ? 'Checking...' : 'Check Now'}
                                        </button>
                                    </div>

                                    {availabilityStatus.available !== undefined && !availabilityStatus.loading && (
                                        <div className="col-12 mt-3 text-center">
                                            <div className={`p-4 rounded-4 ${availabilityStatus.available ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                                                <i className={`bi ${availabilityStatus.available ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} display-6 mb-2 d-block`}></i>
                                                <h5 className={`fw-bold mb-1 ${availabilityStatus.available ? 'text-success' : 'text-danger'}`}>
                                                    {availabilityStatus.available ? 'Unit is Available!' : 'Unit is Booked'}
                                                </h5>
                                                {availabilityStatus.available && (
                                                    <button
                                                        className="btn btn-success btn-sm mt-3 fw-bold px-4"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                propertyId: availabilityForm.propertyId,
                                                                unitId: availabilityForm.unitId,
                                                                startAt: availabilityForm.startAt,
                                                                endAt: availabilityForm.endAt
                                                            });
                                                            setShowAvailabilityModal(false);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Create Booking Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {showDetailModal && selectedBooking && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">Booking Details</h4>
                                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-4 d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                                    <div className="avatar-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold h4 mb-0" style={{ width: '60px', height: '60px' }}>
                                        {selectedBooking.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-1">{selectedBooking.user?.name}</h5>
                                        <div className="text-muted small">{selectedBooking.user?.email}</div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div className="p-3 border rounded-3 h-100">
                                            <div className="text-muted small text-uppercase fw-bold mb-1">Space</div>
                                            <div className="fw-bold">{selectedBooking.unit?.property?.title}</div>
                                            <div className="badge bg-primary-soft text-primary mt-1">Unit: {selectedBooking.unit?.unitCode}</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-3 border rounded-3 h-100">
                                            <div className="text-muted small text-uppercase fw-bold mb-1">Price</div>
                                            <div className="h4 fw-bold text-dark mb-0">${selectedBooking.totalPrice}</div>
                                            <div className={`badge rounded-pill mt-1 ${selectedBooking.paymentStatus === 2 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                                                {selectedBooking.paymentStatus === 2 ? 'Paid' : 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-3">
                                    <div className="text-muted small text-uppercase fw-bold mb-2">Schedule</div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">In:</span>
                                        <span className="fw-bold">{new Date(selectedBooking.startAt).toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Out:</span>
                                        <span className="fw-bold">{new Date(selectedBooking.endAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="mt-3 p-3 bg-light rounded-3">
                                        <div className="small text-uppercase fw-bold text-muted mb-1">Notes</div>
                                        <p className="mb-0 small">{selectedBooking.notes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-primary w-100 fw-bold py-2 rounded-3" onClick={() => setShowDetailModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
        .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
        .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
        </MainLayout>
    );
}
