'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { scheduledPostsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

function PreviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [postData, setPostData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram'>('facebook');

    // Determine the base path
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadPostData();
    }, []);

    const loadPostData = async () => {
        try {
            const postId = searchParams.get('postId');

            if (postId) {
                const res = await scheduledPostsApi.getById(postId);
                if (res.success && res.data) {
                    setPostData(res.data.post || res.data);
                }
            } else {
                // Try loading from localStorage for new/draft unsaved posts
                const savedData = localStorage.getItem('previewPostData');
                if (savedData) {
                    setPostData(JSON.parse(savedData));
                }
            }
        } catch (error) {
            console.error('Error loading post data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <Loader size="md" message="Loading preview..." />
            </div>
        );
    }

    if (!postData) {
        return (
            <div className="text-center py-5">
                <i className="bi bi-exclamation-circle display-4 text-warning mb-3"></i>
                <h3>No preview data found</h3>
                <button className="btn btn-primary rounded-pill mt-3" onClick={() => router.push(`${basePath}/social/campaigns`)}>
                    Back to Campaigns
                </button>
            </div>
        );
    }

    return (
        <div className="container py-4 p-6">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-link text-muted p-0" onClick={() => router.back()}>
                        <i className="bi bi-arrow-left fs-4"></i>
                    </button>
                    <h1 className="fw-bold h3 mb-0">Post Preview Showcase</h1>
                </div>
                <div className="btn-group bg-light rounded-pill p-1 shadow-sm">
                    <button
                        className={`btn rounded-pill px-4 btn-sm border-0 ${previewPlatform === 'facebook' ? 'btn-white shadow-sm' : 'text-muted'}`}
                        onClick={() => setPreviewPlatform('facebook')}
                    >
                        <i className="bi bi-facebook me-2 text-primary"></i> Facebook
                    </button>
                    <button
                        className={`btn rounded-pill px-4 btn-sm border-0 ${previewPlatform === 'instagram' ? 'btn-white shadow-sm' : 'text-muted'}`}
                        onClick={() => setPreviewPlatform('instagram')}
                    >
                        <i className="bi bi-instagram me-2 text-danger"></i> Instagram
                    </button>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-6">
                    <div className="preview-container card border-0 shadow-lg rounded-4 overflow-hidden shadow-premium">
                        {previewPlatform === 'facebook' ? (
                            <div className="facebook-preview p-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                                        <i className="bi bi-person-fill text-primary mt-1"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark mb-0">Your Real Estate Business</div>
                                        <div className="text-muted smaller">Just now · <i className="bi bi-globe2 ms-1"></i></div>
                                    </div>
                                </div>

                                <div className="post-content mb-3">
                                    {postData.title && <div className="fw-bold fs-5 mb-1">{postData.title}</div>}
                                    <div className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>{postData.description}</div>
                                    {postData.hashtags && <div className="text-primary mt-2">{postData.hashtags}</div>}
                                </div>

                                {(postData.mediaUrls?.[0] || postData.image_url || postData.image) && (
                                    <div className="post-media rounded-3 overflow-hidden border mb-3">
                                        <img
                                            src={postData.mediaUrls?.[0] || postData.image_url || postData.image}
                                            className="w-100 h-100 object-fit-cover"
                                            style={{ maxHeight: '400px' }}
                                            alt="Post Visualization"
                                        />
                                    </div>
                                )}

                                <div className="d-flex justify-content-around py-3 border-top border-bottom">
                                    <div className="text-muted btn-fb-action"><i className="bi bi-hand-thumbs-up me-2"></i>Like</div>
                                    <div className="text-muted btn-fb-action"><i className="bi bi-chat me-2"></i>Comment</div>
                                    <div className="text-muted btn-fb-action"><i className="bi bi-share me-2"></i>Share</div>
                                </div>
                            </div>
                        ) : (
                            <div className="instagram-preview">
                                <div className="d-flex align-items-center justify-content-between p-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle p-0.5" style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', width: '36px', height: '36px', padding: '2px' }}>
                                            <div className="bg-white rounded-circle w-100 h-100 d-flex align-items-center justify-content-center">
                                                <i className="bi bi-person-fill text-dark smaller"></i>
                                            </div>
                                        </div>
                                        <span className="fw-bold small">your_realestate_brand</span>
                                    </div>
                                    <i className="bi bi-three-dots"></i>
                                </div>

                                {(postData.mediaUrls?.[0] || postData.image_url || postData.image) && (
                                    <div className="ig-media-square w-100 ratio ratio-1x1 border-top border-bottom">
                                        <img
                                            src={postData.mediaUrls?.[0] || postData.image_url || postData.image}
                                            className="w-100 h-100 object-fit-cover"
                                            alt="Instagram Visualization"
                                        />
                                    </div>
                                )}

                                <div className="p-3">
                                    <div className="d-flex gap-3 mb-2 fs-4">
                                        <i className="bi bi-heart hover-scale"></i>
                                        <i className="bi bi-chat hover-scale"></i>
                                        <i className="bi bi-send hover-scale"></i>
                                        <i className="bi bi-bookmark ms-auto hover-scale"></i>
                                    </div>
                                    <div className="ig-caption small text-dark">
                                        <span className="fw-bold me-2">your_realestate_brand</span>
                                        {postData.title && <span className="fw-bold">{postData.title} - </span>}
                                        {postData.description}
                                        {postData.hashtags && <div className="text-primary mt-1">{postData.hashtags}</div>}
                                    </div>
                                    <div className="text-muted smaller mt-2 text-uppercase">Just now</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="d-flex gap-3 mt-5 justify-content-center">
                        <button className="btn btn-light rounded-pill px-5 shadow-sm" onClick={() => router.back()}>
                            <i className="bi bi-pencil me-2"></i> Continue Editing
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .min-vh-60 { min-height: 60vh; }
                .smaller { font-size: 0.75rem; }
                .btn-white { background: white; color: var(--bs-primary); }
                .shadow-premium { box-shadow: 0 2rem 5rem rgba(0,0,0,0.1) !important; }
                .btn-fb-action { transition: all 0.2s; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
                .btn-fb-action:hover { background: rgba(0,0,0,0.05); color: var(--bs-primary) !important; }
                .hover-scale { transition: transform 0.2s; cursor: pointer; }
                .hover-scale:hover { transform: scale(1.1); }
                .ig-media-square { background: #fafafa; }
            `}</style>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <MainLayout activePage="social-campaigns">
            <Suspense fallback={<div className="p-5 text-center">Loading Preview...</div>}>
                <PreviewContent />
            </Suspense>
        </MainLayout>
    );
}
