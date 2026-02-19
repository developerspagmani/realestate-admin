'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { connectedAccountsApi } from '@/lib/api/social';

interface InstagramPost {
    id: string;
    caption?: string;
    media_type: string;
    media_url: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    permalink: string;
}

export default function InstagramCheckerPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<any>(null);

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await connectedAccountsApi.getAll({ isActive: true });
            const accounts = res.data?.accounts || [];

            // Find Meta account
            const metaAccount = accounts.find((acc: any) => acc.platform.toLowerCase() === 'meta' || acc.platform.toLowerCase() === 'facebook');

            if (metaAccount) {
                setAccount(metaAccount);
                const igId = metaAccount.pages?.[0]?.instagram_business_account?.id || metaAccount.metadata?.instagram_business_id;

                if (igId && metaAccount.access_token) {
                    await fetchInstagramPosts(igId, metaAccount.access_token);
                }
            }
        } catch (error) {
            console.error('Error loading Instagram data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstagramPosts = async (businessId: string, token: string) => {
        try {
            const response = await fetch(
                `https://graph.facebook.com/v18.0/${businessId}/media?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink&access_token=${token}`
            );
            const data = await response.json();
            if (data.data) {
                setPosts(data.data);
            }
        } catch (e) {
            console.error('API Error:', e);
        }
    };

    return (
        <MainLayout activePage="social-accounts">
            <div className="container-fluid py-4 p-6">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <button
                            onClick={() => router.push(`${basePath}/social/accounts`)}
                            className="btn btn-link text-muted p-0 mb-1 text-decoration-none small d-flex align-items-center gap-1"
                        >
                            <i className="bi bi-arrow-left"></i> Back to Accounts
                        </button>
                        <h1 className="fw-bold h2 mb-0">Instagram Post Checker</h1>
                        <p className="text-muted small">Viewing live posts directly from your connected Instagram Business Profile</p>
                    </div>
                    {account && (
                        <div className="d-flex align-items-center gap-2 bg-white p-2 px-3 rounded-pill shadow-sm border">
                            <i className="bi bi-instagram text-danger"></i>
                            <span className="fw-bold small">{account.pages?.[0]?.name || 'Connected Profile'}</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="text-muted mt-3">Fetching live media from Instagram...</p>
                    </div>
                ) : !account ? (
                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                        <i className="bi bi-instagram display-1 text-muted opacity-25 mb-4"></i>
                        <h3>Instagram Not Connected</h3>
                        <p className="text-muted mb-4">Please connect your Meta/Instagram Business account first.</p>
                        <button onClick={() => router.push(`${basePath}/social/accounts`)} className="btn btn-primary rounded-pill px-5">
                            Go to Accounts
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-camera display-4 text-muted opacity-50 mb-3"></i>
                        <h4>No Posts Found</h4>
                        <p className="text-muted">We couldn't find any recent posts on this Instagram account.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {posts.map((post) => (
                            <div key={post.id} className="col-md-6 col-lg-4 col-xl-3">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 hover-lift transition-all">
                                    <div className="ratio ratio-1x1 bg-light">
                                        {post.media_type === 'VIDEO' ? (
                                            <video src={post.media_url} className="object-fit-cover w-100 h-100" />
                                        ) : (
                                            <img src={post.media_url} className="object-fit-cover w-100 h-100" alt="Instagram content" />
                                        )}
                                        <div className="position-absolute top-0 end-0 p-2">
                                            {post.media_type === 'VIDEO' && <span className="badge bg-dark bg-opacity-75 rounded-pill"><i className="bi bi-play-fill"></i></span>}
                                            {post.media_type === 'CAROUSEL_ALBUM' && <span className="badge bg-dark bg-opacity-75 rounded-pill"><i className="bi bi-images"></i></span>}
                                        </div>
                                    </div>
                                    <div className="card-body p-4">
                                        <p className="text-dark small line-clamp-3 mb-3">{post.caption || 'No caption'}</p>
                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                            <div className="d-flex gap-3">
                                                <span className="text-danger small fw-bold">
                                                    <i className="bi bi-heart-fill me-1"></i> {post.like_count || 0}
                                                </span>
                                                <span className="text-primary small fw-bold">
                                                    <i className="bi bi-chat-fill me-1"></i> {post.comments_count || 0}
                                                </span>
                                            </div>
                                            <a href={post.permalink} target="_blank" rel="noopener" className="btn btn-link btn-sm p-0 text-muted">
                                                <i className="bi bi-box-arrow-up-right"></i>
                                            </a>
                                        </div>
                                        <div className="mt-2 smaller text-muted opacity-75">
                                            {new Date(post.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
                }
                .transition-all { transition: all 0.23s ease; }
                .smaller { font-size: 0.75rem; }
            `}</style>
        </MainLayout>
    );
}
