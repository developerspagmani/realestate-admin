'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ActivateAccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid activation link. No token provided.');
            return;
        }

        const verifyToken = async () => {
            try {
                // Dynamically import api service
                const { authService } = await import('@/app/services/api');
                const response = await authService.verifyEmail(token);

                if (response.success) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Verification failed. Link may be expired.');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'An error occurred during verification.');
                console.error('Verification error:', error);
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="card shadow-sm border-0 rounded-4" style={{ width: '500px' }}>
            <div className="card-body p-5 text-center">

                {status === 'verifying' && (
                    <>
                        <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h3 className="fw-bold mb-3">Verifying Email</h3>
                        <p className="text-muted">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <div className="fade-in">
                        <div className="mb-4">
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h3 className="fw-bold mb-3 text-success">Account Activated!</h3>
                        <p className="text-muted mb-4">{message}</p>
                        <Link href="/login" className="btn btn-primary rounded-4 px-5 fw-bold shadow-sm">
                            Login Now
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="fade-in">
                        <div className="mb-4">
                            <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h3 className="fw-bold mb-3 text-danger">Activation Failed</h3>
                        <p className="text-muted mb-4">{message}</p>
                        <Link href="/login" className="btn btn-light rounded-4 px-5 fw-bold">
                            Back to Login
                        </Link>
                    </div>
                )}

            </div>
            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default function ActivateAccountPage() {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <Suspense fallback={
                <div className="card shadow-sm border-0 rounded-4" style={{ width: '500px' }}>
                    <div className="card-body p-5 text-center">
                        <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h3 className="fw-bold mb-3">Initialising...</h3>
                    </div>
                </div>
            }>
                <ActivateAccountContent />
            </Suspense>
        </div>
    );
}
