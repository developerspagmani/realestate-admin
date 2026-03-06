'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { bookingService, userService, unitService, propertyService, agentService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import { Booking, User, Unit, Property, Agent } from '@/types';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import React from 'react';

interface BookingsManagerProps {
    mode: 'admin' | 'owner';
}

export default function BookingsManager({ mode }: BookingsManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        userId: '',
        unitId: '',
        propertyId: '',
        startAt: '',
        endAt: '',
        status: 1, // pending
        paymentStatus: 1, // pending
        notes: '',
        specialRequests: '',
        agentId: '',
        guestName: '',
        guestEmail: '',
        guestPhone: ''
    });

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'past'>('all');
    const [availabilityStatus, setAvailabilityStatus] = useState<{ loading: boolean; available?: boolean; conflicts?: Booking[]; price?: number }>({ loading: false });
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [availabilityForm, setAvailabilityForm] = useState({ propertyId: '', unitId: '', startAt: '', endAt: '' });
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

    // Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

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
    const urlUnitId = searchParams.get('unitId');

    useEffect(() => {
        setMounted(true);
    }, []);

    const [currentDate, setCurrentDate] = useState(new Date());

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const searchParamsObj: { tenantId?: string; ownerId?: string; unitId?: string } = {
                tenantId: tenantId || undefined,
                ...(mode === 'admin' && activeOwnerId ? { ownerId: activeOwnerId } : {})
            };
            if (urlUnitId) searchParamsObj.unitId = urlUnitId;

            const [bookingsRes, usersRes, propertiesRes, unitsRes, agentsRes] = await Promise.all([
                bookingService.getBookings(token, {
                    ...searchParamsObj,
                    industryType,
                    limit: '100' // Increased limit for management
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

            if (bookingsRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawBookings: any[] = bookingsRes.data.bookings || bookingsRes.data || [];
                setBookings(rawBookings.map((b) => ({
                    ...b,
                    id: String(b.id),
                    status: Number(b.status),
                    startAt: b.startAt,
                    endAt: b.endAt,
                    unit: b.unit ? {
                        ...b.unit,
                        id: String(b.unit.id || b.unitId),
                        unitCode: b.unit.unitCode || b.unit.unitCode_alias || 'N/A',
                        property: b.unit.property ? {
                            ...b.unit.property,
                            id: String(b.unit.property.id || b.unit.propertyId),
                            name: b.unit.property.title || b.unit.property.name || 'Untitled',
                        } : undefined
                    } : undefined,
                    property: b.property ? {
                        ...b.property,
                        id: String(b.property.id || b.propertyId),
                        name: b.property.title || b.property.name || 'Untitled',
                    } : undefined
                } as Booking)));
            }

            if (usersRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawUsers: any[] = usersRes.data.users || usersRes.data || [];
                setUsers(rawUsers.map(u => ({ ...u, id: String(u.id) } as User)));
            }

            if (propertiesRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawProps: any[] = propertiesRes.data.properties || propertiesRes.data || [];
                setProperties(rawProps.map(p => ({
                    ...p,
                    id: String(p.id),
                    name: p.title || p.name || 'Untitled'
                } as Property)));
            }

            if (unitsRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawUnits: any[] = unitsRes.data.units || unitsRes.data || [];
                setUnits(rawUnits.map(u => ({
                    ...u,
                    id: String(u.id),
                    unitCode: u.unitCode || u.unitCode_alias || 'N/A'
                } as Unit)));
            }

            if (agentsRes && agentsRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawAgents: any[] = agentsRes.data.agents || agentsRes.data || [];
                setAgents(rawAgents.map(a => ({ ...a, id: String(a.id) } as Agent)));
            }

        } catch (error) {
            console.error('Failed to load bookings data:', error);
            showToast('Failed to load bookings', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeOwnerId, activeTenantId, mode, tenantType, urlUnitId, user?.tenantId]);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [mounted, isAuthenticated, user, router, activeTenantId, activeOwnerId, tenantType, loadData]);

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
            const propertyTitle = (booking.unit?.property?.title || booking.property?.title || '').toLowerCase();
            const guestName = (booking.guestName || '').toLowerCase();
            const guestEmail = (booking.guestEmail || '').toLowerCase();

            const matchesSearch =
                userName.includes(searchTerm.toLowerCase()) ||
                guestName.includes(searchTerm.toLowerCase()) ||
                guestEmail.includes(searchTerm.toLowerCase()) ||
                unitCode.includes(searchTerm.toLowerCase()) ||
                propertyTitle.includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || booking.status.toString() === filterStatus;

            let matchesTab = true;
            const now = new Date();
            const start = new Date(booking.startAt);
            const end = booking.endAt ? new Date(booking.endAt) : new Date(start.getTime() + 60 * 60 * 1000);

            if (activeTab === 'pending') {
                matchesTab = booking.status === 1;
            } else if (activeTab === 'confirmed') {
                // Show both pending and confirmed in Upcoming as long as they haven't ended
                matchesTab = (booking.status === 1 || booking.status === 2) && end >= now;
            } else if (activeTab === 'past') {
                // Show completed, cancelled, or confirmed/pending that have already passed
                matchesTab = booking.status === 4 || booking.status === 3 || ((booking.status === 1 || booking.status === 2) && end < now);
            }

            return matchesSearch && matchesStatus && matchesTab;
        });
    }, [bookings, searchTerm, filterStatus, activeTab]);

    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBookings, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, activeTab, itemsPerPage]);

    const checkAvailability = React.useCallback(async (isManual: boolean = false) => {
        const targetForm = isManual ? availabilityForm : formData;
        if (!targetForm.unitId || !targetForm.startAt) return;

        try {
            setAvailabilityStatus({ loading: true });
            const token = getAuthToken();
            if (!token) return;

            const startDate = new Date(targetForm.startAt);
            let endDate;

            if (targetForm.endAt) {
                endDate = new Date(targetForm.endAt);
            } else {
                endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 1);
            }

            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;

            const searchParamsObj: { unitId: string; startAt: string; endAt: string; tenantId: string; bookingId?: string } = {
                unitId: targetForm.unitId,
                startAt: startDate.toISOString(),
                endAt: endDate.toISOString(),
                tenantId: tenantId || '',
            };

            if (!isManual && editingBooking) {
                searchParamsObj.bookingId = editingBooking.id;
            }

            const res = await bookingService.checkAvailability(token, searchParamsObj);
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
    }, [activeTenantId, availabilityForm, editingBooking, formData, mode, user?.tenantId]);

    useEffect(() => {
        if (formData.unitId && formData.startAt && formData.endAt) {
            const timer = setTimeout(() => checkAvailability(false), 500);
            return () => clearTimeout(timer);
        } else {
            setAvailabilityStatus({ loading: false });
        }
    }, [formData.unitId, formData.startAt, formData.endAt, checkAvailability]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            if (!token) return;

            if (!formData.startAt) {
                showToast('Please select a visit date and time', 'error');
                return;
            }

            const startDate = new Date(formData.startAt);
            let endDate;

            if (formData.endAt) {
                endDate = new Date(formData.endAt);
            } else {
                endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 1);
            }

            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;

            const payload = {
                ...formData,
                tenantId: tenantId || undefined,
                startAt: startDate.toISOString(),
                endAt: endDate.toISOString(),
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
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const response = await bookingService.updateBookingStatus(token, id, status, undefined, tenantId || '');
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

    const handleSendInfo = async (id: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const response = await bookingService.sendVisitInfo(token, id, (tenantId) as string);
            if (response.success) {
                showToast('Visit information email sent to prospect');
            } else {
                showToast(response.message || 'Failed to send visit info', 'error');
            }
        } catch (error) {
            console.error('Error sending visit info:', error);
            showToast('Error sending visit info', 'error');
        }
    };

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (!window.confirm(`Delete ${ids.length > 1 ? ids.length + ' visits' : 'this visit'}?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;

            await Promise.all(ids.map(bookingId => bookingService.deleteBooking(token, bookingId, tenantId || '')));
            showToast(`${ids.length > 1 ? ids.length + ' visits' : 'Visit'} deleted successfully`);
            setSelectedBookings(prev => prev.filter(uid => !ids.includes(uid)));
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Error deleting visit(s)', 'error');
        }
    };

    const toggleSelectAll = () => {
        setSelectedBookings(selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 ? [] : filteredBookings.map(u => u.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedBookings(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const handleExport = () => {
        const exportList = selectedBookings.length > 0
            ? filteredBookings.filter(u => selectedBookings.includes(u.id))
            : filteredBookings;
        if (exportList.length === 0) { showToast('No visits to export', 'error'); return; }

        const headers = ['Visit ID', 'Date', 'Time', 'Guest Name', 'Email', 'Phone', 'Property', 'Unit', 'Status'];
        const rows = exportList.map(b => [
            `"${b.id}"`,
            `"${new Date(b.startAt).toLocaleDateString()}"`,
            `"${new Date(b.startAt).toLocaleTimeString()}"`,
            `"${b.guestName || b.user?.name || 'Guest'}"`,
            `"${b.guestEmail || b.user?.email || ''}"`,
            `"${b.guestPhone || b.user?.phone || ''}"`,
            `"${b.unit?.property?.title || b.property?.title || 'Unknown'}"`,
            `"${b.unit?.unitCode || 'N/A'}"`,
            `"${getStatusLabel(b.status).label}"`
        ]);

        const csv = [headers, ...rows].map(r => r.join(',').replace(/\r?\n|\r/g, ' ')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visits_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(`${exportList.length} visit${exportList.length !== 1 ? 's' : ''} exported successfully`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = (event.target?.result as string).split('\n').filter(l => l.trim());
            if (lines.length < 2) { showToast('Invalid CSV file', 'error'); return; }
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
            setCsvHeaders(headers);
            setCsvRows(rows);

            const fields = ['guestName', 'guestEmail', 'guestPhone', 'unitCode', 'startAt', 'notes'];
            const init: Record<string, string> = {};
            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase()));
                if (match) init[f] = match;
            });
            setMapping(init);
            setImportStep('mapping');
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        setImportStep('progress');
        setImportTotal(csvRows.length);
        setImportProgress(0);
        const token = getAuthToken();
        const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
        if (!token || !tenantId) return;

        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const get = (f: string) => { const h = mapping[f]; if (!h) return undefined; return row[csvHeaders.indexOf(h)]; };

            try {
                const guestEmail = (get('guestEmail') || '').trim();
                const guestName = (get('guestName') || '').trim();
                const guestPhone = (get('guestPhone') || '').trim();
                const notes = (get('notes') || '').trim();
                const unitCode = (get('unitCode') || '').trim();

                // 1. Resolve Unit
                let resolvedUnitId = formData.unitId || '';
                if (unitCode) {
                    const match = units.find(u => u.unitCode.toLowerCase() === unitCode.toLowerCase());
                    if (match) resolvedUnitId = match.id;
                }

                if (!resolvedUnitId) {
                    console.warn('Skipping import row due to missing unit:', row);
                    continue;
                }
                // 2. Resolve User by Email if possible
                let resolvedUserId = '';
                if (guestEmail) {
                    const match = users.find(u => u.email?.toLowerCase() === guestEmail.toLowerCase());
                    if (match) {
                        resolvedUserId = match.id;
                    }
                }

                const startDate = get('startAt') ? new Date(get('startAt')!) : new Date();
                const endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 1);

                await bookingService.createBooking(token, {
                    tenantId: tenantId as string,
                    unitId: resolvedUnitId,
                    userId: resolvedUserId || undefined,
                    guestName: guestName,
                    guestEmail: guestEmail,
                    guestPhone: guestPhone,
                    startAt: startDate.toISOString(),
                    endAt: endDate.toISOString(),
                    notes: notes,
                    status: 1 // pending
                });
            } catch (err) {
                console.error('Import failed for row', i, err);
            }
            setImportProgress(i + 1);
        }
        showToast(`Import completed: ${csvRows.length} visits processed`);
        loadData();
        setShowImportModal(false);
        setImportStep('file');
    };

    const getStatusLabel = (status: number) => {
        const config: Record<number, { label: string; class: string; icon: string }> = {
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
            agentId: '',
            guestName: '',
            guestEmail: '',
            guestPhone: ''
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
                        <h2 className="fw-bold mb-1">{mode === 'admin' ? 'Visit Schedules' : 'My Visits'}</h2>
                        <p className="text-muted small mb-0">Manage property visits and site schedules</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={handleExport}>
                            <i className="bi bi-download"></i>
                            <span className="d-none d-md-inline">Export{selectedBookings.length > 0 ? ` (${selectedBookings.length})` : ''}</span>
                        </button>
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-upload"></i>
                            <span className="d-none d-md-inline">Import</span>
                        </button>
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
                            <span>Create Visit</span>
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="btn-group shadow-sm bg-white p-1 rounded-3">
                        <button
                            className={`btn btn-sm px-3 ${viewMode === 'table' ? 'btn-primary shadow-none' : 'btn-white border-0'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <i className="bi bi-table me-2"></i> Table View
                        </button>
                        <button
                            className={`btn btn-sm px-3 ${viewMode === 'calendar' ? 'btn-primary shadow-none' : 'btn-white border-0'}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            <i className="bi bi-calendar3 me-2"></i> Calendar
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
                                    {selectedBookings.length > 0 && (
                                        <button className="btn btn-sm btn-outline-danger border-0 ms-2" onClick={() => handleDelete(selectedBookings)} title="Delete Selected">
                                            <i className="bi bi-trash-fill"></i>
                                        </button>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {viewMode === 'table' ? (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="vi-table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 px-4" style={{ width: 40 }}>
                                            <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                                checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Guest Details</th>
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
                                            <td colSpan={8} className="text-center py-5">
                                                <Loader message="Fetching bookings..." />
                                            </td>
                                        </tr>
                                    ) : paginatedBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5">
                                                <i className="bi bi-calendar-x display-4 text-muted mb-3 d-block"></i>
                                                <p className="text-muted">No reservations found matching your criteria</p>
                                            </td>
                                        </tr>
                                    ) : paginatedBookings.map((booking) => {
                                        const status = getStatusLabel(booking.status);
                                        const isSelected = selectedBookings.includes(booking.id);
                                        return (
                                            <tr key={booking.id} className={`cursor-pointer ${isSelected ? 'table-active' : ''}`} onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }}>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                                        checked={isSelected} onChange={() => toggleSelect(booking.id)} />
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                            {(booking.guestName || booking.user?.name || 'G').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{booking.guestName || booking.user?.name || 'Guest'}</div>
                                                            <div className="text-muted small">{booking.guestEmail || booking.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="fw-semibold text-dark">{booking.unit?.property?.title || booking.property?.title || 'Unknown Property'}</div>
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
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="fw-bold text-success small">FREE VISIT</div>
                                                    <div className="text-muted small">No payment required</div>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`badge rounded-4 px-3 py-2 d-inline-flex align-items-center gap-2 ${status.class}`}>
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
                                                                    userId: booking.userId || '',
                                                                    unitId: booking.unitId || '',
                                                                    propertyId: booking.propertyId || booking.property?.id || booking.unit?.propertyId || booking.unit?.property?.id || '',
                                                                    startAt: booking.startAt,
                                                                    endAt: booking.endAt,
                                                                    status: booking.status || 1,
                                                                    paymentStatus: booking.paymentStatus || 1,
                                                                    notes: booking.notes || '',
                                                                    specialRequests: booking.specialRequests || '',
                                                                    agentId: booking.agentId || '',
                                                                    guestName: booking.guestName || booking.user?.name || '',
                                                                    guestEmail: booking.guestEmail || booking.user?.email || '',
                                                                    guestPhone: booking.guestPhone || booking.user?.phone || ''
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
                        {filteredBookings.length > itemsPerPage && (
                            <div className="card-footer border-0 bg-white p-3 border-top">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3 text-muted small">
                                        <div className="d-flex align-items-center gap-2">
                                            <span>Rows per page:</span>
                                            <select
                                                className="form-select form-select-sm bg-light border-0 w-auto"
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                                            >
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                        <div className="vr h-15px"></div>
                                        <div>
                                            Showing <span className="fw-bold text-dark">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="fw-bold text-dark">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of <span className="fw-bold text-dark">{filteredBookings.length}</span> results
                                        </div>
                                    </div>
                                    <nav>
                                        <ul className="pagination pagination-sm mb-0 gap-1">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link rounded-2 border-0 bg-light text-dark" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                            </li>
                                            <li className="page-item disabled">
                                                <span className="page-link border-0 bg-white text-dark small fw-bold">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                            </li>
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link rounded-2 border-0 bg-light text-dark" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <CalendarView
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        bookings={filteredBookings}
                        onEventClick={(booking: Booking) => {
                            if (!booking) return;
                            setSelectedBooking(booking);
                            setShowDetailModal(true);
                        }}
                        getStatusLabel={getStatusLabel}
                    />
                )}
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">{editingBooking ? 'Update Visit Schedule' : 'Schedule a Property Visit'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">
                                                Select Visitor / Prospect
                                                {loading && <Loader size="sm" message="" />}
                                            </label>
                                            <select
                                                className="form-select form-select-lg bg-light border-0"
                                                value={formData.userId || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'new' || val === '') {
                                                        setFormData({ ...formData, userId: val === 'new' ? '' : val, guestName: '', guestEmail: '', guestPhone: '' });
                                                    } else {
                                                        const selUser = users.find(u => u.id === val);
                                                        setFormData({
                                                            ...formData,
                                                            userId: val,
                                                            guestName: selUser?.name || '',
                                                            guestEmail: selUser?.email || '',
                                                            guestPhone: selUser?.phone || ''
                                                        });
                                                    }
                                                }}
                                            >
                                                <option value="">{loading ? 'Fetching records...' : 'Choose a prospect...'}</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                                <option value="new">+ Add New Guest / Lead</option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Visitor Name</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.guestName}
                                                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                                                placeholder="Full Name"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control bg-light border-0"
                                                value={formData.guestEmail}
                                                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                                                placeholder="email@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Mobile Number</label>
                                            <input
                                                type="tel"
                                                className="form-control bg-light border-0"
                                                value={formData.guestPhone}
                                                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                                                placeholder="+1 234 567 890"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Assigned Agent</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.agentId || ''}
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
                                                value={formData.propertyId || ''}
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
                                                value={formData.unitId || ''}
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

                                        <div className="col-md-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Visit Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-light border-0"
                                                value={formatForInput(formData.startAt)}
                                                onChange={(e) => {
                                                    const startAt = e.target.value;
                                                    // Auto-set endAt to 1 hour after startAt for backend compatibility
                                                    let endAt = '';
                                                    if (startAt) {
                                                        const endDate = new Date(startAt);
                                                        endDate.setHours(endDate.getHours() + 1);
                                                        endAt = endDate.toISOString();
                                                    }
                                                    setFormData({ ...formData, startAt, endAt });
                                                }}
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
                                                            <Loader size="sm" message="" />
                                                        ) : availabilityStatus.available === true ? (
                                                            <i className="bi bi-check-circle-fill text-success"></i>
                                                        ) : availabilityStatus.available === false ? (
                                                            <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                                                        ) : (
                                                            <i className="bi bi-info-circle text-muted"></i>
                                                        )}
                                                        <span className="fw-bold">
                                                            {availabilityStatus.loading ? 'Checking Availability...' :
                                                                availabilityStatus.available === true ? 'Visit is Available' :
                                                                    availabilityStatus.available === false ? 'Visit is not Available' : 'Select Unit & Dates'}
                                                        </span>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="text-muted small d-block">Visit Fee</span>
                                                        <span className="h4 fw-bold mb-0 text-success">Free</span>
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
                                        {editingBooking ? 'Save Updates' : 'Schedule Visit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div >
            )
            }

            {/* Availability Tool Modal */}
            {
                showAvailabilityModal && (
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
                                                onChange={(e) => {
                                                    setAvailabilityForm({ ...availabilityForm, propertyId: e.target.value, unitId: '' });
                                                    setAvailabilityStatus({ available: undefined, loading: false });
                                                }}
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
                                                onChange={(e) => {
                                                    setAvailabilityForm({ ...availabilityForm, unitId: e.target.value });
                                                    setAvailabilityStatus({ available: undefined, loading: false });
                                                }}
                                                disabled={!availabilityForm.propertyId}
                                            >
                                                <option value="">Select Unit...</option>
                                                {units
                                                    .filter(u => u.propertyId === availabilityForm.propertyId)
                                                    .map(u => <option key={u.id} value={u.id}>{u.unitCode}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Visit Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-light border-0"
                                                value={availabilityForm.startAt}
                                                onChange={(e) => {
                                                    const startAt = e.target.value;
                                                    let endAt = '';
                                                    if (startAt) {
                                                        const endDate = new Date(startAt);
                                                        endDate.setHours(endDate.getHours() + 1);
                                                        endAt = endDate.toISOString();
                                                    }
                                                    setAvailabilityForm({ ...availabilityForm, startAt, endAt });
                                                    setAvailabilityStatus({ available: undefined, loading: false });
                                                }}
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
                                                        {availabilityStatus.available ? 'Unit is Available for Visit!' : 'Unit is Scheduled for another visit'}
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
                                                            Schedule Visit Now
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
                )
            }

            {/* Detail View Modal */}
            {
                showDetailModal && selectedBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4 pb-0">
                                    <h4 className="fw-bold mb-0">Visit Details</h4>
                                    <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-4 d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                                        <div className="avatar-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold h4 mb-0" style={{ width: '60px', height: '60px' }}>
                                            {(selectedBooking.guestName || selectedBooking.user?.name || 'G').charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1">{selectedBooking.guestName || selectedBooking.user?.name || 'Guest'}</h5>
                                            <div className="text-muted small">{selectedBooking.guestEmail || selectedBooking.user?.email}</div>
                                            {(selectedBooking.guestPhone || selectedBooking.user?.phone) && (
                                                <div className="text-muted small">
                                                    <i className="bi bi-telephone me-1"></i>
                                                    {selectedBooking.guestPhone || selectedBooking.user?.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="p-3 border rounded-3 h-100">
                                                <div className="text-muted small text-uppercase fw-bold mb-1">Property/Unit</div>
                                                <div className="fw-bold">{selectedBooking.unit?.property?.title}</div>
                                                <div className="badge bg-primary-soft text-primary mt-1">Unit: {selectedBooking.unit?.unitCode}</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 border rounded-3 h-100">
                                                <div className="text-muted small text-uppercase fw-bold mb-1">Fee</div>
                                                <div className="h4 fw-bold text-success mb-0">FREE</div>
                                                <div className="badge rounded-4 mt-1 bg-success-soft text-success">
                                                    In-Person Visit
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 border rounded-3">
                                        <div className="text-muted small text-uppercase fw-bold mb-2">Schedule</div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="text-muted">Datetime:</span>
                                            <span className="fw-bold">{new Date(selectedBooking.startAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {selectedBooking.notes && (
                                        <div className="mt-3 p-3 bg-light rounded-3">
                                            <div className="small text-uppercase fw-bold text-muted mb-1">Notes</div>
                                            <p className="mb-0 small">{selectedBooking.notes}</p>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-top">
                                        <h6 className="fw-bold small text-uppercase text-muted mb-3 d-flex align-items-center gap-2">
                                            <i className="bi bi-person-badge text-primary"></i>
                                            Assigned Agent Information
                                        </h6>
                                        {selectedBooking.agent ? (
                                            <div className="p-3 border rounded-3 bg-white">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px' }}>
                                                        {selectedBooking.agent.user?.name?.charAt(0) || 'A'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{selectedBooking.agent.user?.name || `${selectedBooking.agent.user?.firstName} ${selectedBooking.agent.user?.lastName}`}</div>
                                                        <div className="text-muted small d-flex align-items-center gap-2">
                                                            <i className="bi bi-envelope"></i>
                                                            {selectedBooking.agent.user?.email || 'N/A'}
                                                        </div>
                                                        {selectedBooking.agent.user?.phone && (
                                                            <div className="text-muted small d-flex align-items-center gap-2 mt-1">
                                                                <i className="bi bi-telephone"></i>
                                                                {selectedBooking.agent.user?.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 border rounded-3 bg-light text-center">
                                                <span className="text-muted small italic">No agent assigned to this visit yet.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0 flex-column gap-2">
                                    {!(selectedBooking.guestEmail || selectedBooking.user?.email || selectedBooking.lead?.email) && (
                                        <div className="alert alert-warning py-2 mb-2 rounded-3 small border-0 d-flex align-items-center gap-2">
                                            <i className="bi bi-exclamation-triangle"></i>
                                            Recipent email not found. Please edit booking to add email.
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                        onClick={() => handleSendInfo(selectedBooking.id)}
                                        disabled={!(selectedBooking.guestEmail || selectedBooking.user?.email || selectedBooking.lead?.email)}
                                    >
                                        <i className="bi bi-send-fill"></i>
                                        Send Info Email to Guest
                                    </button>
                                    <button className="btn btn-light w-100 fw-bold py-2 rounded-3" onClick={() => setShowDetailModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Import Modal ── */}
            {showImportModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-2">
                                <h5 className="fw-bold mb-0">Import Visits from CSV</h5>
                                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {importStep === 'file' && (
                                    <div className="text-center py-5 border border-2 border-dashed rounded-4 bg-light">
                                        <i className="bi bi-file-earmark-excel display-3 text-primary mb-3 d-block"></i>
                                        <h5>Choose a CSV File</h5>
                                        <p className="text-muted small mb-4">Select a .csv file containing visit details</p>
                                        <input type="file" accept=".csv" className="d-none" id="csv-upload" onChange={handleFileChange} />
                                        <label htmlFor="csv-upload" className="btn btn-primary px-4 fw-bold" style={{ cursor: 'pointer' }}>Select File</label>
                                    </div>
                                )}
                                {importStep === 'mapping' && (
                                    <div>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold small text-muted text-uppercase">1. Default Unit (if not matched by code)</label>
                                            <select className="form-select bg-light border-0" value={formData.unitId} onChange={e => setFormData({ ...formData, unitId: e.target.value })}>
                                                <option value="">Select Target Unit...</option>
                                                {units.map(u => <option key={u.id} value={u.id}>{u.unitCode} - {u.property?.title}</option>)}
                                            </select>
                                        </div>
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-3">2. Column Mapping</label>
                                        <div className="row g-2 overflow-auto" style={{ maxHeight: 320 }}>
                                            {['guestName', 'guestEmail', 'guestPhone', 'unitCode', 'startAt', 'notes'].map(field => (
                                                <div key={field} className="col-md-6">
                                                    <div className="p-2 bg-light rounded border d-flex align-items-center">
                                                        <div className="flex-grow-1 small fw-bold text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</div>
                                                        <select className="form-select form-select-sm border-0 bg-white shadow-none" style={{ width: 150 }} value={mapping[field] || ''} onChange={e => setMapping({ ...mapping, [field]: e.target.value })}>
                                                            <option value="">Skip</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                                            <button className="btn btn-light px-4" onClick={() => setImportStep('file')}>Back</button>
                                            <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={executeImport}>Execute Import ({csvRows.length} records)</button>
                                        </div>
                                    </div>
                                )}
                                {importStep === 'progress' && (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                                        <h5>Importing Data...</h5>
                                        <p className="text-muted mb-4">Processing {importProgress} of {importTotal} records</p>
                                        <div className="progress rounded-4 bg-light" style={{ height: 12, maxWidth: 400, margin: '0 auto' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                )}
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
        </MainLayout >
    );
}

interface CalendarViewProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    bookings: Booking[];
    onEventClick: (booking: Booking) => void;
    getStatusLabel: (status: number) => { label: string; class: string; icon: string };
}

// Calendar View Component
function CalendarView({ currentDate, setCurrentDate, bookings, onEventClick, getStatusLabel }: CalendarViewProps) {
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const today = () => setCurrentDate(new Date());

    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Padding for first week
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const isToday = (day: number) => {
        const now = new Date();
        return now.getDate() === day && now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
    };

    const getEventsForDay = (day: number) => {
        if (!bookings) return [];
        return bookings.filter((b: Booking) => {
            if (!b.startAt) return false;
            const date = new Date(b.startAt);
            return date.getDate() === day && date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
        });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(currentDate.getFullYear(), parseInt(e.target.value), 1);
        setCurrentDate(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(parseInt(e.target.value), currentDate.getMonth(), 1);
        setCurrentDate(newDate);
    };

    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i);
    }

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            <div className="card-header bg-white border-0 p-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                        <select
                            className="form-select border-0 bg-light fw-bold col-3"
                            style={{ cursor: 'pointer', width: 'auto' }}
                            value={currentDate.getMonth()}
                            onChange={handleMonthChange}
                        >
                            {monthNames.map((name, index) => (
                                <option key={name} value={index}>{name}</option>
                            ))}
                        </select>
                        <select
                            className="form-select border-0 bg-light fw-bold col-3"
                            style={{ cursor: 'pointer', width: '120px' }}
                            value={currentDate.getFullYear()}
                            onChange={handleYearChange}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light btn-sm px-3 shadow-none border" onClick={today}>Today</button>
                        <div className="btn-group shadow-sm rounded-2 overflow-hidden">
                            <button className="btn btn-white btn-sm px-3 border" onClick={prevMonth}><i className="bi bi-chevron-left"></i></button>
                            <button className="btn btn-white btn-sm px-3 border" onClick={nextMonth}><i className="bi bi-chevron-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-body p-0">
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-header-day text-center py-2 fw-bold text-muted small border-bottom border-end bg-light">
                            {day}
                        </div>
                    ))}
                    {days.map((day, idx) => (
                        <div key={idx} className={`calendar-day border-bottom border-end p-2 ${day ? 'bg-white' : 'bg-light'} ${day && isToday(day) ? 'bg-primary-soft' : ''}`} style={{ minHeight: '120px' }}>
                            {day && (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className={`fw-bold small px-2 py-1 rounded-circle ${isToday(day) ? 'bg-primary text-white' : ''}`} style={{ width: '38px', height: '38px', textAlign: 'center', lineHeight: '30px' }}>{day}</span>
                                    </div>
                                    <div className="calendar-events d-flex flex-column gap-1">
                                        {getEventsForDay(day).map((event: Booking) => {
                                            const status = getStatusLabel(event.status);
                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`event-tag p-2 rounded-3 cursor-pointer shadow-sm border-start border-4 ${status.class}`}
                                                    style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEventClick(event);
                                                    }}
                                                >
                                                    <div className="fw-bold mb-0">{new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="text-truncate" title={event.user?.name || 'Guest'}>
                                                        {event.user?.name ? event.user.name.split(' ')[0] : 'Guest'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-top: 1px solid var(--bs-gray-200);
                    border-left: 1px solid var(--bs-gray-200);
                }
                .calendar-day {
                    transition: all 0.2s;
                }
                .calendar-day:hover {
                    background-color: var(--bs-gray-50) !important;
                }
                .event-tag {
                    transition: transform 0.1s, box-shadow 0.1s;
                }
                .event-tag:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
}
