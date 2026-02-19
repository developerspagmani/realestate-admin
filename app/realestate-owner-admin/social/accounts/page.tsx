'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { connectedAccountsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';

interface ConnectedAccount {
    id: string;
    platform: string;
    accountName: string;
    isActive: boolean;
}

interface AccountStats {
    total: number;
    active: number;
    inactive: number;
}

const PLATFORMS = [
    { id: 'FACEBOOK', name: 'Facebook', color: 'primary', icon: 'bi-facebook' },
    { id: 'INSTAGRAM', name: 'Instagram', color: 'danger', icon: 'bi-instagram' },
    { id: 'GOOGLE', name: 'Google My Business', color: 'warning', icon: 'bi-google' },
    { id: 'TWITTER', name: 'Twitter', color: 'info', icon: 'bi-twitter-x' },
    { id: 'LINKEDIN', name: 'LinkedIn', color: 'primary', icon: 'bi-linkedin' },
    { id: 'TIKTOK', name: 'TikTok', color: 'dark', icon: 'bi-tiktok' },
    { id: 'WHATSAPP', name: 'WhatsApp Business', color: 'success', icon: 'bi-whatsapp' }
];

export default function ConnectedAccountsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AccountStats>({ total: 0, active: 0, inactive: 0 });

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const [accountsRes, statsRes] = await Promise.all([
                connectedAccountsApi.getAll(),
                connectedAccountsApi.getStats()
            ]);

            if (accountsRes.success) {
                setAccounts(accountsRes.data.accounts || []);
            }

            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = (platform: string) => {
        const redirectUri = `${window.location.origin}${basePath}/auth/${platform.toLowerCase()}/callback`;

        if (platform === 'FACEBOOK') {
            const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;
            const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
            window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
        } else if (platform === 'GOOGLE') {
            const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            const scope = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/youtube.upload';
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
        } else if (platform === 'WHATSAPP') {
            router.push(`${basePath}/social/whatsapp`);
        } else {
            alert(`${platform} integration is coming soon!`);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            const res = await connectedAccountsApi.disconnect(id);
            if (res.success) {
                loadAccounts();
            }
        } catch (error) {
            console.error('Error disconnecting account:', error);
        }
    };

    const handleRefresh = async (id: string) => {
        try {
            const res = await connectedAccountsApi.refreshToken(id);
            if (res.success) {
                loadAccounts();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="social-accounts">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-accounts">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="mb-4 d-flex justify-content-between align-items-end">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Connected Accounts</h1>
                        <p className="text-muted small">Manage your social media connections and status</p>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <button
                            onClick={async () => {
                                if (!confirm('Simulate a successful Meta connection for testing?')) return;
                                try {
                                    setLoading(true);
                                    const testData = {
                                        platform: 'FACEBOOK',
                                        accessToken: 'dummy_access_token_' + Math.random().toString(36).substring(7),
                                        accountId: 'vpx_' + Math.random().toString(36).substring(7),
                                        accountName: 'Test Business Account',
                                        metadata: { simulated: true, pages: [{ id: '123', name: 'Test Page', instagram_business_account: { id: 'ig_123', name: 'Test Insta' } }] }
                                    };
                                    const res = await connectedAccountsApi.connect(testData);
                                    if (res.success) {
                                        alert('Simulated connection successful!');
                                        loadAccounts();
                                    }
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="btn btn-outline-secondary btn-sm rounded-pill px-3 border-dashed"
                        >
                            <i className="bi bi-bug me-1"></i> Simulate Connect
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="row g-4 mb-4">
                    <div className="col-md-4">
                        <StatCard label="Total Accounts" value={stats.total || 0} icon="bi-grid" color="primary" />
                    </div>
                    <div className="col-md-4">
                        <StatCard label="Active" value={stats.active || 0} icon="bi-check-circle" color="success" />
                    </div>
                    <div className="col-md-4">
                        <StatCard label="Inactive" value={stats.inactive || 0} icon="bi-dash-circle" color="danger" />
                    </div>
                </div>

                {/* Connected Accounts */}
                <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4 pb-0">
                        <h5 className="fw-bold mb-0">Your Connected Accounts</h5>
                    </div>
                    <div className="card-body p-4">
                        {accounts.length > 0 ? (
                            <div className="row g-3">
                                {accounts.map((account) => {
                                    const platform = PLATFORMS.find(p => p.id === account.platform);
                                    return (
                                        <div key={account.id} className="col-12">
                                            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between p-3 border border-light-subtle rounded-4 bg-light bg-opacity-50">
                                                <div className="d-flex align-items-center gap-4 mb-3 mb-md-0">
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center bg-${platform?.color || 'secondary'} bg-opacity-10`} style={{ width: '56px', height: '56px' }}>
                                                        <i className={`bi ${platform?.icon || 'bi-phone'} fs-3 text-${platform?.color || 'secondary'}`}></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-dark">{account.accountName}</h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>{account.platform}</span>
                                                            <span className={`badge ${account.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                                                                {account.isActive ? 'Active' : 'Error'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        onClick={() => handleRefresh(account.id)}
                                                        className="btn btn-white btn-sm px-3 shadow-sm border rounded-pill fw-semibold"
                                                    >
                                                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                                                    </button>
                                                    {account.platform === 'FACEBOOK' && (
                                                        <button
                                                            onClick={() => router.push(`${basePath}/social/accounts/instagram-checker`)}
                                                            className="btn btn-white btn-sm px-3 shadow-sm border rounded-pill fw-semibold"
                                                        >
                                                            <i className="bi bi-instagram me-1 text-danger"></i> View IG Posts
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDisconnect(account.id)}
                                                        className="btn btn-outline-danger btn-sm px-3 rounded-pill fw-semibold"
                                                    >
                                                        <i className="bi bi-link-45deg me-1"></i> Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted small">
                                <i className="bi bi-link-45deg display-4 mb-2 d-block opacity-25"></i>
                                <p className="mb-0">No active social media connections</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Platforms */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4 pb-0">
                        <h5 className="fw-bold mb-0">Connect New Account</h5>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            {PLATFORMS.map((platform) => {
                                const isConnected = accounts.some(a => a.platform === platform.id && a.isActive);
                                return (
                                    <div key={platform.id} className="col-md-6 col-lg-4">
                                        <button
                                            onClick={() => !isConnected && handleConnect(platform.id)}
                                            disabled={isConnected}
                                            className={`btn btn-white w-100 h-100 text-start p-4 border rounded-4 transition-all shadow-sm ${isConnected ? 'opacity-75 cursor-not-allowed bg-success-subtle border-success-subtle' : ''}`}
                                            style={{ transition: 'transform 0.2s ease-in-out' }}
                                            onMouseOver={(e) => !isConnected && (e.currentTarget.style.transform = 'translateY(-5px)')}
                                            onMouseOut={(e) => !isConnected && (e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center bg-${platform.color} bg-opacity-10`} style={{ width: '48px', height: '48px' }}>
                                                    <i className={`bi ${platform.icon} fs-4 text-${platform.color}`}></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark">{platform.name}</h6>
                                                    {isConnected ? (
                                                        <span className="small text-success fw-bold">
                                                            <i className="bi bi-check2-circle me-1"></i> Connected
                                                        </span>
                                                    ) : (
                                                        <span className="small text-muted">Click to link account</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .border-dashed { border-style: dashed !important; }
                .cursor-not-allowed { cursor: not-allowed; }
            `}</style>
        </MainLayout>
    );
}



