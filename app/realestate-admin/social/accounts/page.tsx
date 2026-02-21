'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { connectedAccountsApi } from '@/lib/api/social';

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
    { id: 'WHATSAPP', name: 'WhatsApp', color: 'success', icon: 'bi-whatsapp' }
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
        loadMetaSDK();
    }, []);

    const loadMetaSDK = () => {
        const initFB = () => {
            if (window.FB) {
                window.FB.init({
                    appId: process.env.NEXT_PUBLIC_META_APP_ID || '1163988435719406',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
            }
        };

        if (window.FB) {
            initFB();
            return;
        }

        window.fbAsyncInit = function () {
            initFB();
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0] as any;
            if (d.getElementById(id)) return;
            js = d.createElement(s) as any; js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    };

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

    const handleConnect = async (platform: string) => {
        const redirectUri = `${window.location.origin}${basePath}/auth/${platform.toLowerCase()}/callback`;

        if (platform === 'FACEBOOK') {
            const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname === 'localhost';

            // If we have the SDK and are on a secure context (or localhost), try the SDK first
            if (window.FB && isSecure) {
                window.FB.login((response: any) => {
                    if (response.authResponse) {
                        const accessToken = response.authResponse.accessToken;
                        const userId = response.authResponse.userID;

                        const connectAccount = async () => {
                            try {
                                setLoading(true);
                                const res = await connectedAccountsApi.connect({
                                    platform: 'FACEBOOK',
                                    accessToken: accessToken,
                                    accountId: userId,
                                    accountName: 'Facebook Admin',
                                    metadata: { sdk_login: true }
                                });

                                if (res.success) {
                                    alert('Facebook connected successfully!');
                                    loadAccounts();
                                } else {
                                    alert(res.message || 'Failed to connect Facebook');
                                }
                            } catch (e) {
                                console.error(e);
                                alert('An error occurred while connecting');
                            } finally {
                                setLoading(false);
                            }
                        };

                        connectAccount();
                    }
                }, { scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish' });
            } else {
                // FALLBACK: OAuth Redirect Flow (Works over HTTP)
                const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || '1163988435719406';
                const scope = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
                console.log('Using Fallback Redirect Flow due to HTTP protocol');
                window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
            }

        } else if (platform === 'GOOGLE') {
            const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            const scope = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/youtube.upload';
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
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

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
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
                <div className="mb-4">
                    <h1 className="fw-bold h2 mb-1">Social Media Accounts</h1>
                    <p className="text-muted small">Connect and manage your social media integrations</p>
                </div>

                {/* Stats Summary */}
                <div className="row g-4 mb-4">
                    <div className="col-md-4">
                        <StatCard
                            label="Total Accounts"
                            value={stats.total}
                            icon="bi-person-badge"
                            color="primary"
                        />
                    </div>
                    <div className="col-md-4">
                        <StatCard
                            label="Active"
                            value={stats.active}
                            icon="bi-check-circle-fill"
                            color="success"
                        />
                    </div>
                    <div className="col-md-4">
                        <StatCard
                            label="Inactive"
                            value={stats.inactive}
                            icon="bi-exclamation-triangle-fill"
                            color="danger"
                        />
                    </div>
                </div>

                {/* Platform Connections */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white p-3 border-0">
                        <h5 className="mb-0 fw-bold">Platform Connections</h5>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            {PLATFORMS.map(platform => {
                                const account = accounts.find(a => a.platform === platform.id);
                                return (
                                    <div key={platform.id} className="col-md-6 col-xl-4">
                                        <div className="border border-light-subtle rounded-4 p-4 h-100 flex flex-col justify-between transition-all hover:shadow-sm">
                                            <div className="d-flex align-items-center justify-content-between mb-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className={`rounded-circle p-2 bg-${platform.color} bg-opacity-10 text-${platform.color} d-flex align-items-center justify-content-center`} style={{ width: '45px', height: '45px' }}>
                                                        <i className={`bi ${platform.icon} fs-4`}></i>
                                                    </div>
                                                    <h6 className="fw-bold mb-0">{platform.name}</h6>
                                                </div>
                                                {account && (
                                                    <span className={`badge ${account.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3`}>
                                                        {account.isActive ? 'Connected' : 'Error'}
                                                    </span>
                                                )}
                                            </div>

                                            {account ? (
                                                <div className="space-y-3">
                                                    <p className="small fw-semibold text-dark mb-3">{account.accountName}</p>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            onClick={() => handleRefresh(account.id)}
                                                            className="btn btn-sm btn-light border flex-grow-1 rounded-pill"
                                                        >
                                                            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                                                        </button>
                                                        <button
                                                            onClick={() => handleDisconnect(account.id)}
                                                            className="btn btn-sm btn-outline-danger flex-grow-1 rounded-pill"
                                                        >
                                                            <i className="bi bi-link-45deg me-1"></i> Disconnect
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : platform.id === 'WHATSAPP' ? (
                                                <button
                                                    onClick={() => navigateTo('/social/whatsapp')}
                                                    className="btn btn-light w-full rounded-pill fw-semibold py-2"
                                                >
                                                    <i className="bi bi-whatsapp me-2"></i> Setup WhatsApp
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(platform.id)}
                                                    className={`btn btn-${platform.color} w-full rounded-pill fw-semibold py-2`}
                                                >
                                                    Connect {platform.name}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

