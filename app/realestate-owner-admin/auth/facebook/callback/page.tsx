'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { connectedAccountsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

function FacebookCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Connecting your Facebook account...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(`Error: ${error}`);
                setTimeout(() => router.push('/realestate-owner-admin/social/accounts'), 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No authorization code received');
                setTimeout(() => router.push('/realestate-owner-admin/social/accounts'), 3000);
                return;
            }

            // Construct redirectUri (must match what was used in the initial redirect)
            // Use window.location.origin + window.location.pathname and strip any trailing slash to ensure consistency
            const redirectUri = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`;

            // Exchange code for tokens
            const response = await connectedAccountsApi.exchangeMetaCode(code, redirectUri);

            if (response.success) {
                setStatus('success');
                setMessage('Successfully connected your Facebook account!');
                setTimeout(() => router.push('/realestate-owner-admin/social/accounts'), 2000);
            } else {
                setStatus('error');
                setMessage(response.message || 'Failed to connect account');
                setTimeout(() => router.push('/realestate-owner-admin/social/accounts'), 3000);
            }
        } catch (error) {
            console.error('Facebook callback error:', error);
            setStatus('error');
            setMessage('An error occurred while connecting your account');
            setTimeout(() => router.push('/realestate-owner-admin/social/accounts'), 3000);
        }
    };

    return (
        <div className="min-h-screen d-flex align-items-center justify-content-center bg-light">
            <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
                {status === 'processing' && (
                    <div className="mb-4">
                        <Loader size="md" message={message} />
                        <p className="text-muted mt-2">Wait, we are finalizing the connection with Meta.</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-check-lg display-4 text-success"></i>
                        </div>
                        <h2 className="fw-bold mb-3">{message}</h2>
                        <p className="text-muted">Redirecting you back to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-x-lg display-4 text-danger"></i>
                        </div>
                        <h2 className="fw-bold mb-3">Connection Failed</h2>
                        <p className="text-muted mb-4">{message}</p>
                        <button
                            onClick={() => router.push('/realestate-owner-admin/social/accounts')}
                            className="btn btn-primary rounded-pill px-5"
                        >
                            Back to Accounts
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function FacebookCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen d-flex align-items-center justify-content-center">
                <Loader size="md" message="" />
            </div>
        }>
            <FacebookCallbackContent />
        </Suspense>
    );
}
