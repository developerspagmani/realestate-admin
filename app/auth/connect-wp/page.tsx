'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { getAuthToken } from '@/app/services/api';
import { makeApiCall } from '@/app/api/config/endpoints';
import '@/app/globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ConnectWPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuthContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const siteUrl = searchParams.get('site_url');
    const siteName = searchParams.get('site_name');
    const returnUrl = searchParams.get('return_url');
    const platform = searchParams.get('platform') || 'wordpress';

    useEffect(() => {
        if (!authLoading && !user) {
            // Redirect to login if not authenticated, 
            // but keep the search params so we can return here
            const currentUrl = window.location.href;
            router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        }
    }, [user, authLoading, router]);

    const handleConfirm = async () => {
        if (!siteUrl || !returnUrl) {
            setError('Missing required connection parameters.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) throw new Error('Not authenticated');

            // We use makeApiCall which proxies through /api/integrations
            const result = await makeApiCall('/integrations/connect', {
                method: 'POST',
                body: JSON.stringify({
                    siteUrl,
                    siteName,
                    platform,
                    environment: 'production', // Default
                    isSandbox: false
                }),
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (result.success) {
                setSuccess(true);
                // Redirect back to WP with the API key
                const finalUrl = new URL(returnUrl);
                finalUrl.searchParams.append('api_key', result.data.apiKey);
                finalUrl.searchParams.append('status', 'success');

                setTimeout(() => {
                    window.location.href = finalUrl.toString();
                }, 2000);
            } else {
                setError(result.message || 'Failed to establish connection.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-5 text-center">Loading authentication...</div>;
    if (!user) return null;

    return (
        <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center p-3">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="p-5 text-white text-center" style={{ backgroundColor: '#2271b1' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <i className="bi bi-wordpress fs-2"></i>
                    </div>
                    <h2 className="fw-bold mb-1">Connect to WordPress</h2>
                    <p className="opacity-75 small mb-0">Authorizing access for your website</p>
                </div>

                <div className="card-body p-4 p-md-5">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="bg-success-soft rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                                <i className="bi bi-check-lg fs-3"></i>
                            </div>
                            <h4 className="fw-bold text-dark">Connection Successful!</h4>
                            <p className="text-muted small mt-2">Redirecting you back to your WordPress dashboard...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 bg-primary-soft p-3 rounded-3 border border-primary-subtle">
                                <p className="text-primary small mb-0 fw-medium">
                                    <strong>{siteName || 'A WordPress Site'}</strong> ({siteUrl}) wants to connect to your Virpanix account.
                                </p>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex gap-3 mb-3">
                                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                                    <div className="small text-muted">Access to your property widgets and listings.</div>
                                </div>
                                <div className="d-flex gap-3 mb-3">
                                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                                    <div className="small text-muted">Permission to capture leads from your WordPress site.</div>
                                </div>
                                <div className="d-flex gap-3">
                                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                                    <div className="small text-muted">Automatic SEO syncing for property pages.</div>
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-danger border-0 rounded-3 small d-flex gap-2 mb-4">
                                    <i className="bi bi-exclamation-triangle-fill"></i>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="d-grid gap-2">
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="btn btn-primary btn-lg rounded-3 py-3 fw-bold border-0 shadow-sm"
                                    style={{ backgroundColor: '#2271b1' }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Connecting...
                                        </>
                                    ) : 'Authorize & Connect'}
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    disabled={loading}
                                    className="btn btn-light btn-lg rounded-3 py-3 fw-bold text-muted border-0"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <p className="mt-4 text-muted small text-center" style={{ maxWidth: '320px', fontSize: '11px' }}>
                By connecting, you agree to allow the specified WordPress site to access your data via the Virpanix API.
            </p>
        </div>
    );
}

export default function ConnectWPPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
            <ConnectWPContent />
        </Suspense>
    );
}
