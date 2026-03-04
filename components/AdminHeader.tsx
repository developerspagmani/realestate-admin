'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { tenantService, userService, getAuthToken, dashboardService, leadService, paymentService } from '@/app/services/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Loader from '@/components/common/Loader';
import Toast from './common/Toast';

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const { user, logout, isAdmin, isOwner, isAgent } = useAuthContext();
    const {
        tenantType, setTenantType,
        activeTenantId, setActiveTenantId,
        activeOwnerId, setActiveOwnerId,
        setActiveOwnerAndTenant,
        activeTenant
    } = useManagementContext();

    const [owners, setOwners] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutQuote, setLogoutQuote] = useState('');
    const [isSendingSupport, setIsSendingSupport] = useState(false);
    const [supportForm, setSupportForm] = useState({
        subject: '',
        message: '',
        priority: 'Medium'
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const supportRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
                setIsSupportOpen(false);
            }
        };
        document.body.addEventListener('mousedown', handleClickOutside);
        return () => document.body.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOwners = owners.filter(o =>
        o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Ensure activeTenantId is set for owners/agents if not already initialized
    useEffect(() => {
        if ((isOwner || isAgent) && user?.tenantId && !activeTenantId) {
            console.log('AdminHeader: Initializing tenant context:', user.tenantId);
            setActiveOwnerAndTenant(user.id, user.tenantId);
        }
    }, [isOwner, isAgent, user, activeTenantId, setActiveOwnerAndTenant]);

    // Fetch Owners when tenant type changes
    useEffect(() => {
        if (!isAdmin) return;

        const fetchOwners = async () => {
            const token = getAuthToken();
            if (!token) return;

            // Fetch all owners (role 3)
            const userRes = await userService.getOwners(token, {
                limit: '1000'
            });

            if (userRes.success) {
                const ownersList = userRes.data.users || userRes.data || [];
                console.log(`Global owners found:`, ownersList.length);
                setOwners(ownersList);
            }
        };
        fetchOwners();
    }, [isAdmin]);

    const handleOwnerChange = (ownerId: string | null) => {
        if (!ownerId) {
            setActiveOwnerAndTenant(null, null);
            return;
        }

        const selectedOwner = owners.find(o => o.id === ownerId);
        if (selectedOwner) {
            console.log('AdminHeader: Switching to owner:', selectedOwner.name, 'Tenant ID:', selectedOwner.tenantId);
            setActiveOwnerAndTenant(ownerId, selectedOwner.tenantId);
            // If the owner's tenant has a specific industry type, switch to it
            if (selectedOwner.tenant?.type) {
                setTenantType(Number(selectedOwner.tenant.type));
            } else if (selectedOwner.tenantType) {
                setTenantType(Number(selectedOwner.tenantType));
            }
        } else {
            showToast('Owner not found', 'error');
        }
    };

    const quotes = [
        "Success in sales comes to those who consistently show up, follow up, and never give up.",
        "Your income in sales is directly proportional to the value you bring to your customers.",
        "Great salespeople don't push products — they solve problems.",
        "Every 'no' brings you closer to a 'yes.' Keep going.",
        "Sales is not about convincing; it's about understanding and helping.",
        "Confidence, persistence, and preparation are the keys to closing any deal.",
        "The best sales strategy is building trust first and selling second."
    ];

    const handleLogoutInitiate = () => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setLogoutQuote(randomQuote);
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        router.push('/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingSupport(true);

        try {
            // In a real app, you would use a backend service or an email API like SendGrid/Mailgun
            // For now, we simulate the process and show success.
            console.log('Sending support ticket to support@virpanix.com', {
                ...supportForm,
                attachments: attachments.map(f => f.name),
                userEmail: user?.email,
                userName: user?.name
            });

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            showToast('Support ticket sent successfully', 'success');
            setShowSupportModal(false);
            setSupportForm({ subject: '', message: '', priority: 'Medium' });
            setAttachments([]);
        } catch (error) {
            showToast('Failed to send support ticket', 'error');
        } finally {
            setIsSendingSupport(false);
        }
    };

    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);

    const fetchNotifications = async () => {
        const token = getAuthToken();
        if (!token) return;

        setNotifLoading(true);
        try {
            const params = {
                tenantId: activeTenantId || undefined,
                ownerId: activeOwnerId || undefined,
                industryType: tenantType || undefined,
                limit: '5'
            };

            const newNotifications: any[] = [];

            if (isAdmin || isOwner) {
                // Fetch global activities for Admins and Owners
                const [dashRes, leadsRes, paymentsRes] = await Promise.all([
                    dashboardService.getStats(token, params),
                    leadService.getLeads(token, { ...params, limit: '5' }),
                    paymentService.getPayments(token, { ...params, limit: '5' })
                ]);

                // 1. Process Bookings
                if (dashRes.success && dashRes.data.recentBookings) {
                    dashRes.data.recentBookings.forEach((b: any) => {
                        newNotifications.push({
                            id: `booking-${b.id}`,
                            title: 'New Booking',
                            message: `${b.user?.name || 'Customer'} booked Unit ${b.unit?.unitCode || ''}`,
                            time: new Date(b.createdAt).toLocaleString(),
                            rawTime: new Date(b.createdAt),
                            type: 'booking',
                            unread: true,
                            link: `/realestate-owner-admin/bookings/${b.id}`
                        });
                    });
                }

                // 2. Process Leads
                if (leadsRes.success && (leadsRes.data.leads || leadsRes.data)) {
                    const leads = leadsRes.data.leads || leadsRes.data || [];
                    leads.forEach((l: any) => {
                        newNotifications.push({
                            id: `lead-${l.id}`,
                            title: 'New Lead',
                            message: `Lead "${l.name}" expressed interest.`,
                            time: new Date(l.createdAt).toLocaleString(),
                            rawTime: new Date(l.createdAt),
                            type: 'lead',
                            unread: true,
                            link: `/realestate-admin/leads?id=${l.id}`
                        });
                    });
                }

                // 3. Process Payments
                if (paymentsRes.success && (paymentsRes.data.payments || paymentsRes.data)) {
                    const payments = paymentsRes.data.payments || paymentsRes.data || [];
                    payments.forEach((p: any) => {
                        newNotifications.push({
                            id: `payment-${p.id}`,
                            title: 'Payment Received',
                            message: `Payment of ${p.amount} ${p.currency} received.`,
                            time: new Date(p.createdAt).toLocaleString(),
                            rawTime: new Date(p.createdAt),
                            type: 'payment',
                            unread: false,
                            link: `/realestate-admin/payments`
                        });
                    });
                }
            } else if (isAgent) {
                // Fetch Agent-specific activities
                const { agentService } = await import('@/app/services/api');
                const [leadsRes, commsRes] = await Promise.all([
                    agentService.getMyLeads(token),
                    agentService.getMyCommissions(token)
                ]);

                if (leadsRes.success && leadsRes.data.leads) {
                    leadsRes.data.leads.slice(0, 5).forEach((l: any) => {
                        newNotifications.push({
                            id: `agent-lead-${l.id}`,
                            title: 'Lead Assigned',
                            message: `You were assigned lead: ${l.name}`,
                            time: new Date(l.createdAt).toLocaleString(),
                            rawTime: new Date(l.createdAt),
                            type: 'lead',
                            unread: true,
                            link: `/realestate-agent/leads`
                        });
                    });
                }

                if (commsRes.success && commsRes.data.commissions) {
                    commsRes.data.commissions.slice(0, 5).forEach((c: any) => {
                        newNotifications.push({
                            id: `agent-comm-${c.id}`,
                            title: 'Commission Update',
                            message: `Commission of ${c.amount} is ${c.status}`,
                            time: new Date(c.createdAt).toLocaleString(),
                            rawTime: new Date(c.createdAt),
                            type: 'payment',
                            unread: false,
                            link: `/realestate-agent/commissions`
                        });
                    });
                }
            }

            // Sort by time
            newNotifications.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());
            setNotifications(newNotifications.slice(0, 10)); // Keep top 10

        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setNotifLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: poll every 5 minutes
            const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user, activeTenantId, activeOwnerId, tenantType]);

    const unreadCount = notifications.filter(n => n.unread).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    if (!user) return null;

    const roleLabel = isAdmin ? 'System Administrator' : isOwner ? 'Property Owner' : isAgent ? 'Sales Agent' : 'Standard User';
    const settingsPath = isAdmin ? '/realestate-admin/settings' : isOwner ? '/realestate-owner-admin/settings' : isAgent ? '/realestate-agent/profile' : '/user/settings';
    const profilePath = isAgent ? '/realestate-agent/profile' : '/user/profile';

    return (
        <header className="admin-header bg-white border-bottom sticky-top shadow-sm">
            <div className="d-flex align-items-center justify-content-between h-100" style={{ height: '80px' }}>

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn-icon d-lg-none me-2"
                    onClick={onMenuClick}
                >
                    <i className="bi bi-list fs-3"></i>
                </button>

                {/* Left Side: Search & Welcome */}
                <div className="d-flex align-items-center gap-4 flex-grow-1">
                    <div className="search-bar position-relative d-none d-md-block" style={{ maxWidth: '300px', width: '100%' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control bg-light border-0 ps-5 py-2 rounded-3 fs-14"
                            placeholder="Search everything..."
                        />
                    </div>

                    {/* Searchable Company Selector for Admins */}
                    {isAdmin && !pathname.includes('/realestate-owner-admin') && (
                        <>
                            <div className="company-selector-wrapper ms-2" ref={dropdownRef}>
                                <div
                                    className="d-flex align-items-center gap-2 bg-light p-2 rounded-3 border border-primary-subtle cursor-pointer transition-all hover-shadow-sm"
                                    style={{ minWidth: '240px' }}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <i className="bi bi-building-fill text-primary ms-1"></i>
                                    <div className="flex-grow-1">
                                        <div className="extra-small text-muted text-uppercase fw-bold line-height-1" style={{ fontSize: '9px' }}>Property Company</div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="fw-bold text-dark fs-14 line-height-1">
                                                {owners.find(o => o.id === activeOwnerId)?.name || 'Select Company'}
                                            </div>
                                            {activeOwnerId && owners.find(o => o.id === activeOwnerId)?.tenant?.plan && (
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-4 fw-bold" style={{ fontSize: '9px' }}>
                                                    {owners.find(o => o.id === activeOwnerId)?.tenant?.plan?.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <i className={`bi bi-chevron-${isDropdownOpen ? 'up' : 'down'} text-muted extra-small me-1`}></i>
                                </div>

                                {isDropdownOpen && (
                                    <div className="dropdown-menu show border-0 shadow-lg mt-2 p-0 rounded-4 overflow-hidden animate-fade-in" style={{ width: '300px', position: 'absolute', zIndex: 1050 }}>
                                        <div className="p-3 bg-light border-bottom">
                                            <div className="input-group input-group-sm">
                                                <span className="input-group-text bg-white border-end-0">
                                                    <i className="bi bi-search text-muted small"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0 ps-0"
                                                    placeholder="Search company or email..."
                                                    autoFocus
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div className="owners-list overflow-auto" style={{ maxHeight: '350px' }}>
                                            <button
                                                className={`dropdown-item py-2 px-3 border-bottom d-flex align-items-center gap-3 ${!activeOwnerId ? 'bg-primary-subtle' : ''}`}
                                                onClick={() => {
                                                    handleOwnerChange(null);
                                                    setIsDropdownOpen(false);
                                                    setSearchTerm('');
                                                }}
                                            >
                                                <i className="bi bi-slash-circle text-muted"></i>
                                                <div>
                                                    <div className="fw-bold small">Clear Selection</div>
                                                    <div className="extra-small text-muted">View all platform data</div>
                                                </div>
                                            </button>

                                            {filteredOwners.length > 0 ? (
                                                filteredOwners.map(o => (
                                                    <button
                                                        key={o.id}
                                                        className={`dropdown-item py-2 px-3 border-bottom d-flex align-items-center gap-3 ${activeOwnerId === o.id ? 'bg-primary-subtle' : ''}`}
                                                        onClick={() => {
                                                            handleOwnerChange(o.id);
                                                            setIsDropdownOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className="avatar avatar-sm bg-primary-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                            {o.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="overflow-hidden flex-grow-1">
                                                            <div className="fw-bold text-dark text-truncate small">{o.name || 'Unnamed Company'}</div>
                                                            <div className="extra-small text-muted text-truncate">{o.email || 'No email provided'}</div>
                                                        </div>
                                                        {o.tenant?.plan && (
                                                            <div className="text-end">
                                                                <div className="badge bg-light text-dark border extra-small mb-1">
                                                                    {o.tenant.plan.name}
                                                                </div>
                                                                <div className={`extra-small fw-bold ${o.tenant.subscriptionStatus === 1 ? 'text-success' : 'text-danger'}`}>
                                                                    {o.tenant.subscriptionStatus === 1 ? 'Active' : 'Expired'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-muted">
                                                    <i className="bi bi-building-exclamation fs-3 mb-2 d-block"></i>
                                                    <div className="small">No companies found</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Subscription Plan Display - Visible for both Admins (with selected owner) and Owners */}
                    {(isAdmin ? (activeOwnerId && !pathname.includes('/realestate-owner-admin')) : isOwner) && (
                        <div className="d-none d-xl-flex flex-column border-start ps-3 py-1 ms-2">
                            <Link
                                href={isAdmin ? `/realestate-admin/subscriptions?ownerId=${activeOwnerId}` : '/realestate-owner-admin/subscriptions'}
                                className="text-decoration-none transition-all hover-opacity-75"
                            >
                                <div className="extra-small text-muted text-uppercase fw-bold line-height-1 mb-1" style={{ fontSize: '9px' }}>Current Plan</div>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="badge bg-success-subtle text-success border border-success-subtle rounded-4 fw-bold shadow-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                                        <i className="bi bi-gem-fill me-1"></i>
                                        {activeTenant?.plan?.name || owners.find(o => o.id === activeOwnerId)?.tenant?.plan?.name || 'Active Plan'}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right Side: Utils & Profile */}
                <div className="d-flex align-items-center gap-3">

                    {/* Time & Date Display (Hidden on smaller screens) */}
                    <div className="d-none d-lg-flex flex-column text-end me-3">
                        <span className="fw-bold text-dark small">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-muted extra-small">
                            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    {/* Quick Utils */}
                    <div className="d-flex align-items-center gap-2 border-end pe-3 me-2">
                        <div className="position-relative" ref={supportRef}>
                            <button
                                className={`btn btn-icon rounded-3 ${isSupportOpen ? 'btn-primary text-white shadow-sm' : 'btn-light-soft text-muted'}`}
                                title="Quick Support"
                                onClick={() => {
                                    setIsSupportOpen(!isSupportOpen);
                                    setIsNotifOpen(false);
                                }}
                            >
                                <i className="bi bi-question-circle"></i>
                            </button>

                            {isSupportOpen && (
                                <div className="dropdown-menu show border-0 shadow-lg mt-2 p-3 rounded-4 animate-fade-in" style={{ width: '260px', position: 'absolute', right: 0, zIndex: 1050 }}>
                                    <div className="pb-2 mb-2 border-bottom">
                                        <h6 className="fw-bold mb-0">Quick Support</h6>
                                        <p className="extra-small text-muted mb-0">How can we help you today?</p>
                                    </div>

                                    <div className="d-flex flex-column gap-1">
                                        <Link href="/docs" className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 border-0">
                                            <div className="rounded-circle bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="bi bi-book text-white small"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold fs-14">Documentation</div>
                                                <div className="extra-small text-muted">Step-by-step guides</div>
                                            </div>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setShowSupportModal(true);
                                                setIsSupportOpen(false);
                                            }}
                                            className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 border-0 bg-transparent text-start m-0"
                                        >
                                            <div className="rounded-circle bg-success bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="bi bi-ticket-perforated text-success small"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold fs-14">Support Ticket</div>
                                                <div className="extra-small text-muted">Report an issue</div>
                                            </div>
                                        </button>

                                        <Link href="/tutorials" className="dropdown-item d-flex align-items-center gap-3 py-2 px-3 border-0">
                                            <div className="rounded-circle bg-danger bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="bi bi-play-circle text-danger small"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold fs-14">Video Tutorials</div>
                                                <div className="extra-small text-muted">Learn features fast</div>
                                            </div>
                                        </Link>

                                        <div className="mt-2 pt-2 border-top">
                                            <div className="d-flex justify-content-between align-items-center px-2">
                                                <span className="extra-small fw-bold text-muted text-uppercase">System Status</span>
                                                <div className="d-flex align-items-center gap-1">
                                                    <span className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></span>
                                                    <span className="extra-small text-success fw-bold">Online</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="position-relative" ref={notifRef}>
                            <button
                                className={`btn btn-icon rounded-3 ${isNotifOpen ? 'btn-primary text-white shadow-sm' : 'btn-light-soft text-muted'}`}
                                title="Notifications"
                                onClick={() => {
                                    setIsNotifOpen(!isNotifOpen);
                                    setIsSupportOpen(false);
                                }}
                            >
                                <i className="bi bi-bell text-muted"></i>
                                {unreadCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                        <span className="visually-hidden">New alerts</span>
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div className="dropdown-menu show border-0 shadow-lg mt-2 p-0 rounded-4 overflow-hidden animate-fade-in" style={{ width: '320px', position: 'absolute', right: 0, zIndex: 1050 }}>
                                    <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <h6 className="fw-bold mb-0">Notifications</h6>
                                            {notifLoading && <Loader size="sm" message="" />}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button className="btn btn-link btn-sm p-0 extra-small text-decoration-none fw-bold" onClick={markAllRead}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notification-list overflow-auto" style={{ maxHeight: '400px' }}>
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-3 border-bottom d-flex gap-3 transition-all hover-bg-light cursor-pointer position-relative ${n.unread ? 'bg-primary-subtle bg-opacity-10' : ''}`}>
                                                    <div className={`notification-icon rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${n.type === 'lead' ? 'bg-info-soft text-info' : n.type === 'booking' ? 'bg-success-soft text-success' : n.type === 'payment' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'}`} style={{ width: '36px', height: '36px' }}>
                                                        <i className={`bi ${n.type === 'lead' ? 'bi-person-plus' : n.type === 'booking' ? 'bi-calendar-check' : n.type === 'payment' ? 'bi-currency-dollar' : 'bi-info-circle'}`}></i>
                                                    </div>
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                                            <div className={`fw-bold fs-14 text-dark text-truncate ${n.unread ? '' : 'opacity-75'}`}>{n.title}</div>
                                                            <div className="extra-small text-muted flex-shrink-0 ms-2">{n.time}</div>
                                                        </div>
                                                        <div className="extra-small text-muted text-wrap line-clamp-2">{n.message}</div>
                                                    </div>
                                                    {n.unread && <div className="position-absolute top-50 end-0 translate-middle-y me-2"><div className="bg-primary rounded-circle" style={{ width: '6px', height: '6px' }}></div></div>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-5 text-center text-muted">
                                                <i className="bi bi-bell-slash fs-2 opacity-25 mb-2 d-block"></i>
                                                <div className="small">No notifications yet</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 bg-light text-center">
                                        <button className="btn btn-link btn-sm extra-small text-decoration-none fw-bold text-muted">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn d-flex align-items-center gap-3 p-1 rounded-4 hover-bg-light border-0"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <div className="d-none d-md-block text-end">
                                <div className="fw-bold text-dark fs-14 line-height-1 mb-0">{user.name}</div>
                                <div className="text-muted extra-small line-height-1">{roleLabel}</div>
                            </div>
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>
                                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 py-2 rounded-4" style={{ minWidth: '220px' }}>
                            <li className="px-3 py-2 border-bottom mb-2">
                                <div className="fw-bold text-dark">{user.name}</div>
                                <div className="text-muted extra-small">{user.email}</div>
                            </li>

                            <li>
                                <Link className="dropdown-item d-flex align-items-center gap-3 py-2" href={settingsPath}>
                                    <i className="bi bi-gear-fill text-primary fs-4"></i>
                                    <span>Account Settings</span>
                                </Link>
                            </li>

                            <li><hr className="dropdown-divider opacity-50" /></li>
                            <li>
                                <button className="dropdown-item d-flex align-items-center gap-3 py-2 text-danger" onClick={handleLogoutInitiate}>
                                    <i className="bi bi-box-arrow-right fs-4"></i>
                                    <span className="fw-bold">Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Support Ticket Modal */}
            {showSupportModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 2000 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <form onSubmit={handleSupportSubmit}>
                                <div className="modal-header bg-primary text-white border-0 p-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                            <i className="bi bi-envelope-fill fs-4 text-primary"></i>
                                        </div>
                                        <div>
                                            <h5 className="modal-title fw-bold text-white">Support Center</h5>
                                            <div className="d-flex flex-column">
                                                <p className="extra-small mb-0 opacity-75 text-white">Submit a ticket to support@virpanix.com</p>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <i className="bi bi-clock-history text-white opacity-75 extra-small"></i>
                                                    <p className="extra-small mb-0 text-white" style={{ fontSize: '11px' }}>
                                                        Live Service: 9:00 AM - 9:00 PM IST (GMT+5:30)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowSupportModal(false)}></button>
                                </div>

                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Subject</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 py-2 rounded-3"
                                            placeholder="What can we help you with?"
                                            required
                                            value={supportForm.subject}
                                            onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Priority</label>
                                        <select
                                            className="form-select bg-light border-0 py-2 rounded-3"
                                            value={supportForm.priority}
                                            onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                                        >
                                            <option value="Low">Low - General Question</option>
                                            <option value="Medium">Medium - Feature Issue</option>
                                            <option value="High">High - Urgent Bug</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Message</label>
                                        <textarea
                                            className="form-control bg-light border-0 py-2 rounded-3"
                                            rows={4}
                                            placeholder="Please describe your issue or question in detail..."
                                            required
                                            value={supportForm.message}
                                            onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Attachments (Images/Docs)</label>
                                        <div
                                            className="border-2 border-dashed rounded-3 p-4 text-center cursor-pointer hover-bg-light transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <i className="bi bi-cloud-arrow-up fs-2 text-primary mb-2 d-block"></i>
                                            <div className="fw-bold small">Click to upload files</div>
                                            <div className="extra-small text-muted">Images, PDF, DOCX etc.</div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="d-none"
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                        </div>

                                        {attachments.length > 0 && (
                                            <div className="mt-3 d-flex flex-wrap gap-2">
                                                {attachments.map((file, idx) => (
                                                    <div key={idx} className="badge bg-light border text-dark p-2 d-flex align-items-center gap-2 rounded-3">
                                                        <i className={`bi ${file.type.startsWith('image/') ? 'bi-image' : 'bi-file-earmark-text'}`}></i>
                                                        <span className="extra-small text-truncate" style={{ maxWidth: '100px' }}>{file.name}</span>
                                                        <i className="bi bi-x-circle-fill text-danger cursor-pointer" onClick={() => removeAttachment(idx)}></i>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-light px-4 py-2 rounded-3 fw-bold"
                                        onClick={() => setShowSupportModal(false)}
                                        disabled={isSendingSupport}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4 py-2 rounded-3 fw-bold d-flex align-items-center gap-2"
                                        disabled={isSendingSupport}
                                    >
                                        {isSendingSupport ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-send-fill"></i>
                                                Send Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showLogoutModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 2050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center">
                            <div className="modal-header border-0 p-4 pb-0 justify-content-center">
                                <div className="bg-danger bg-opacity-10 rounded-circle p-3 mb-2 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-door-open-fill fs-1 text-danger"></i>
                                </div>
                            </div>
                            <div className="modal-body p-4 pt-0">
                                <h3 className="fw-bold text-dark mb-3">Ready to leave?</h3>

                                <div className="p-4 bg-light rounded-4 mb-4 border border-primary border-opacity-10 position-relative mx-3">
                                    <i className="bi bi-quote fs-1 position-absolute top-0 start-0 translate-middle text-primary opacity-10"></i>
                                    <p className="fst-italic text-dark mb-0 fs-15 line-height-1" style={{ fontSize: '15px' }}>
                                        "{logoutQuote}"
                                    </p>
                                </div>

                                <p className="text-muted small px-3">
                                    We've saved your progress. Come back soon to close your next big deal!
                                </p>
                            </div>
                            <div className="modal-footer border-0 p-4 d-flex gap-3 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-light px-4 py-2 flex-grow-1 rounded-3 fw-bold border-0 shadow-sm transition-all"
                                    onClick={() => setShowLogoutModal(false)}
                                >
                                    Stay Here
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-4 py-2 flex-grow-1 rounded-3 fw-bold shadow-sm transition-all"
                                    onClick={confirmLogout}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
            <style jsx>{`
                .admin-header {
                    height: 80px;
                    z-index: 999;
                }
                .fs-14 { font-size: 14px; }
                .extra-small { font-size: 11px; }
                .line-height-1 { line-height: 1.2; }
                .btn-icon { width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; }
                .btn-light-soft { background: rgba(0,0,0,0.03); border: none; }
                .btn-light-soft:hover { background: rgba(0,0,0,0.06); }
                .hover-bg-light:hover { background: rgba(0,0,0,0.04); }
                .dropdown-item { transition: all 0.2s; border-radius: 8px; margin: 0 8px; width: calc(100% - 16px); }
                .dropdown-item:hover { background-color: rgba(13, 110, 253, 0.08); color: #0d6efd; }
                .cursor-pointer { cursor: pointer; }
                .hover-shadow-sm:hover { box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); border-color: #0d6efd !important; }
                .bg-primary-light { background-color: rgba(13, 110, 253, 0.1); }
                .avatar-sm { flex-shrink: 0; }
                .animate-fade-in { animation: fadeIn 0.15s ease-out; }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </header>
    );
}
