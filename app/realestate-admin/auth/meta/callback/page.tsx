'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { connectedAccountsApi } from '@/lib/api/social';

function MetaCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Connecting your Meta account...');

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

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
                setTimeout(() => router.push(`${basePath}/social/accounts`), 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No authorization code received');
                setTimeout(() => router.push(`${basePath}/social/accounts`), 3000);
                return;
            }

            // Construct redirectUri (must match what was used in the initial redirect)
            const redirectUri = `${window.location.origin}${window.location.pathname}`;

            // Exchange code for tokens
            const response = await connectedAccountsApi.exchangeMetaCode(code, redirectUri);

            if (response.success) {
                setStatus('success');
                setMessage('Successfully connected your Meta account!');
                setTimeout(() => router.push(`${basePath}/social/accounts`), 2000);
            } else {
                setStatus('error');
                setMessage(response.message || 'Failed to connect account');
                setTimeout(() => router.push(`${basePath}/social/accounts`), 3000);
            }
        } catch (error) {
            console.error('Meta callback error:', error);
            setStatus('error');
            setMessage('An error occurred while connecting your account');
            setTimeout(() => router.push(`${basePath}/social/accounts`), 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'processing' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                        <h2 className="mt-6 text-xl font-semibold text-gray-900">{message}</h2>
                        <p className="mt-2 text-gray-600">Please wait...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-xl font-semibold text-gray-900">{message}</h2>
                        <p className="mt-2 text-gray-600">Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-xl font-semibold text-gray-900">Connection Failed</h2>
                        <p className="mt-2 text-gray-600">{message}</p>
                        <button
                            onClick={() => router.push(`${basePath}/social/accounts`)}
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Accounts
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function MetaCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading authentication...</p>
                </div>
            </div>
        }>
            <MetaCallbackContent />
        </Suspense>
    );
}

