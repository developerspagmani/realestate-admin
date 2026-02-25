'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { scheduledPostsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

interface Campaign {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    platforms: string[];
    mediaUrls?: string[];
    property?: {
        title: string;
    };
}

export default function CampaignsListPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
    const [stats, setStats] = useState({
        total: 0,
        scheduled: 0,
        published: 0,
        drafts: 0
    });
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const [postsRes, statsRes] = await Promise.all([
                scheduledPostsApi.getAll(),
                scheduledPostsApi.getStats()
            ]);

            if (postsRes.success) {
                setCampaigns(postsRes.data.posts || []);
            }

            if (statsRes.success) {
                setStats({
                    total: statsRes.data.total || 0,
                    scheduled: statsRes.data.scheduled || 0,
                    published: statsRes.data.posted || 0, // In stats it returns 'posted'
                    drafts: statsRes.data.drafts || 0
                });
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'POSTED': return 'success';
            case 'SCHEDULED': return 'primary';
            case 'FAILED': return 'danger';
            case 'DRAFT': return 'warning';
            default: return 'secondary';
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const calendarPosts: Record<string, Campaign[]> = {};
    campaigns.forEach(campaign => {
        const date = campaign.scheduledDate.split('T')[0];
        if (!calendarPosts[date]) calendarPosts[date] = [];
        calendarPosts[date].push(campaign);
    });

    return (
        <MainLayout activePage="social-campaigns">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Marketing Campaigns</h1>
                        <p className="text-muted small">Manage and track your cross-platform social media strategy</p>
                    </div>
                    <div className="d-flex gap-3">
                        <div className="btn-group bg-light rounded-pill p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`btn rounded-pill px-4 btn-sm border-0 ${viewMode === 'grid' ? 'btn-white shadow-sm' : 'text-muted'}`}
                            >
                                <i className="bi bi-grid-fill me-2"></i> Grid
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`btn rounded-pill px-4 btn-sm border-0 ${viewMode === 'calendar' ? 'btn-white shadow-sm' : 'text-muted'}`}
                            >
                                <i className="bi bi-calendar3 me-2"></i> Calendar
                            </button>
                        </div>
                        <button
                            onClick={() => navigateTo('/social/campaigns/create')}
                            className="btn btn-primary rounded-pill px-4 shadow-sm"
                        >
                            <i className="bi bi-plus-lg me-2"></i> Create Campaign
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard label="Total" value={stats.total} icon="bi-megaphone" color="success" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Scheduled" value={stats.scheduled} icon="bi-clock-history" color="info" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Published" value={stats.published} icon="bi-check-circle" color="success" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Drafts" value={stats.drafts} icon="bi-journal-text" color="warning" />
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '40vh' }}>
                        <Loader size="md" message="Loading campaigns..." />
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="row g-4">
                        {campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <div key={campaign.id} className="col-md-6 col-lg-4 col-xl-3">
                                    <div
                                        className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all hover-shadow cursor-pointer"
                                        onClick={() => navigateTo(`/social/campaigns/${campaign.id}`)}
                                    >
                                        <div className="position-relative" style={{ height: '160px' }}>
                                            <img
                                                src={campaign.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}
                                                className="w-100 h-100 object-fit-cover"
                                                alt={campaign.title}
                                            />
                                            <div className="position-absolute top-0 end-0 p-3">
                                                <span className={`badge rounded-pill bg-${getStatusColor(campaign.status)} shadow-sm`}>
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            <div className="position-absolute bottom-0 start-0 p-3 w-100 bg-gradient-dark-transparent">
                                                <div className="d-flex gap-1">
                                                    {campaign.platforms.map(p => (
                                                        <span key={p} className="badge bg-white bg-opacity-75 text-dark rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                                            <i className={`bi bi-${p.toLowerCase()} scale-75`}></i>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body p-4">
                                            <h5 className="fw-bold text-dark text-truncate mb-1">{campaign.title}</h5>
                                            {campaign.property && (
                                                <div className="small text-primary fw-medium mb-3 d-flex align-items-center gap-1">
                                                    <i className="bi bi-house-door"></i> {campaign.property.title}
                                                </div>
                                            )}
                                            <p className="text-muted small mb-3 line-clamp-2">
                                                {campaign.description || 'No description provided.'}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center mt-auto">
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <i className="bi bi-calendar2-event"></i>
                                                    <span>{new Date(campaign.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-muted small">
                                                    <i className="bi bi-clock me-1"></i>
                                                    {campaign.scheduledTime}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center py-5">
                                <div className="card border-0 shadow-sm rounded-4 p-5">
                                    <i className="bi bi- megaphone display-1 text-muted opacity-25 mb-4"></i>
                                    <h3 className="fw-bold">No Campaigns Found</h3>
                                    <p className="text-muted mb-4">Start your first marketing campaign to engage with your audience.</p>
                                    <button
                                        onClick={() => navigateTo('/social/campaigns/create')}
                                        className="btn btn-primary rounded-pill px-5 shadow-sm mx-auto"
                                    >
                                        Launch First Campaign
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Calendar View */
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <h5 className="fw-bold mb-0">
                                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h5>
                                <div className="d-flex gap-1">
                                    <button
                                        className="btn btn-light btn-sm rounded-circle"
                                        onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <button
                                        className="btn btn-light btn-sm rounded-circle"
                                        onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setSelectedMonth(new Date())}>
                                Today
                            </button>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <div className="calendar-grid">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center py-2 fw-bold small text-muted text-uppercase mb-2">
                                        {day}
                                    </div>
                                ))}
                                {getDaysInMonth(selectedMonth).map((date, idx) => {
                                    const isToday = date && date.toDateString() === new Date().toDateString();
                                    const dateKey = date ? formatDateKey(date) : '';
                                    const dayPosts = calendarPosts[dateKey] || [];

                                    return (
                                        <div
                                            key={idx}
                                            className={`calendar-day border rounded-3 p-2 mb-1 me-1 ${!date ? 'bg-light border-0 opacity-25' : ''} ${isToday ? 'border-success border-2 bg-success bg-opacity-10' : ''}`}
                                            style={{ minHeight: '120px' }}
                                        >
                                            {date && (
                                                <>
                                                    <div className={`fw-bold small mb-2 ${isToday ? 'text-success' : 'text-muted'}`}>
                                                        {date.getDate()}
                                                    </div>
                                                    <div className="d-flex flex-column gap-1">
                                                        {dayPosts.map(post => (
                                                            <div
                                                                key={post.id}
                                                                className={`p-1 px-2 rounded-2 smaller text-white text-truncate cursor-pointer shadow-sm bg-${getStatusColor(post.status)}`}
                                                                style={{ fontSize: '10px' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCampaign(post);
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <i className={`bi bi-${post.platforms[0]?.toLowerCase()} me-1`}></i>
                                                                {post.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick View Modal */}
                {showModal && selectedCampaign && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 rounded-4 shadow-lg">
                                <div className="modal-header border-0 p-4 pb-0">
                                    <h5 className="modal-title fw-bold">Campaign Details</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div className="rounded-4 overflow-hidden" style={{ width: '80px', height: '80px' }}>
                                            <img
                                                src={selectedCampaign.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80'}
                                                className="w-100 h-100 object-fit-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div>
                                            <h4 className="fw-bold mb-1">{selectedCampaign.title}</h4>
                                            <span className={`badge rounded-pill bg-${getStatusColor(selectedCampaign.status)} bg-opacity-10 text-${getStatusColor(selectedCampaign.status)}`}>
                                                {selectedCampaign.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-muted smaller fw-bold text-uppercase mb-1 d-block">Schedule</label>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="bi bi-calendar-check text-primary"></i>
                                            <span>{new Date(selectedCampaign.scheduledDate).toLocaleDateString()} at {selectedCampaign.scheduledTime}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-muted smaller fw-bold text-uppercase mb-1 d-block">Description</label>
                                        <p className="text-dark small mb-0 line-clamp-3">{selectedCampaign.description || 'No description available.'}</p>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-outline-info rounded-pill py-2"
                                            onClick={() => navigateTo(`/social/campaigns/create?repost=${selectedCampaign.id}`)}
                                        >
                                            <i className="bi bi-arrow-repeat me-2"></i> Re-post
                                        </button>
                                        {(selectedCampaign.status === 'SCHEDULED' || selectedCampaign.status === 'DRAFT') && (
                                            <button
                                                className="btn btn-outline-primary rounded-pill py-2"
                                                onClick={() => navigateTo(`/social/campaigns/${selectedCampaign.id}/edit`)}
                                            >
                                                <i className="bi bi-pencil me-2"></i> Edit Campaign
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-primary rounded-pill py-2"
                                            onClick={() => navigateTo(`/social/campaigns/${selectedCampaign.id}`)}
                                        >
                                            View Full Campaign
                                        </button>
                                        <button
                                            className="btn btn-light rounded-pill py-2"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-shadow:hover { 
                    transform: translateY(-5px);
                    box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
                }
                .cursor-pointer { cursor: pointer; }
                .bg-gradient-dark-transparent {
                    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .scale-75 { transform: scale(0.75); }
                .smaller { font-size: 0.75rem; }
            `}</style>
        </MainLayout>
    );
}
