'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { publishedPostsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';

interface PublishedPost {
    id: string;
    title: string;
    description?: string;
    status: string;
    publishedAt: string;
    platform: string;
    metrics?: {
        likes?: number;
        comments?: number;
        shares?: number;
        reach?: number;
    };
    scheduledPost?: {
        title: string;
        property?: {
            title: string;
        };
    };
}

interface PostStats {
    total?: number;
    last7Days?: number;
    totalLikes?: number;
    totalReach?: number;
}

export default function PublishedPostsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PostStats>({});

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadPosts();
    }, []);

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            const [postsRes, statsRes] = await Promise.all([
                publishedPostsApi.getAll(),
                publishedPostsApi.getStats()
            ]);

            if (postsRes.success) {
                setPosts(postsRes.data.posts || []);
            }

            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading published posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async (id: string) => {
        try {
            const res = await publishedPostsApi.refresh(id);
            if (res.success) {
                loadPosts();
                alert('Metrics refreshed successfully');
            } else {
                alert(res.message || 'Failed to refresh metrics');
            }
        } catch (error) {
            console.error('Error refreshing metrics:', error);
            alert('An error occurred while refreshing metrics');
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="social-published">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-published">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Published Content</h1>
                        <p className="text-muted small">Track performance of your live social media posts</p>
                    </div>
                    <button
                        onClick={() => navigateTo('/social/campaigns/create')}
                        className="btn btn-primary rounded-pill px-4"
                    >
                        <i className="bi bi-plus-lg me-2"></i> Create New Post
                    </button>
                </div>

                {/* Stats */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard label="Total Published" value={posts.length} icon="bi-send-check" color="success" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Total Likes" value={stats.totalLikes || 0} icon="bi-heart" color="danger" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Total Reach" value={stats.totalReach || 0} icon="bi-eye" color="info" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Avg Engagement" value="3.8%" icon="bi-graph-up" color="primary" />
                    </div>
                </div>

                {/* Posts List */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white p-4 border-0">
                        <h5 className="fw-bold mb-0">Live Feed</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 border-0 small">Post Detail</th>
                                    <th className="px-4 py-3 border-0 small">Platforms</th>
                                    <th className="px-4 py-3 border-0 small">Performance</th>
                                    <th className="px-4 py-3 border-0 small">Published At</th>
                                    <th className="px-4 py-3 border-0 small text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <tr key={post.id}>
                                            <td className="px-4 py-3 border-0">
                                                <div className="fw-bold text-dark">{post.scheduledPost?.title || post.id}</div>
                                                {post.scheduledPost?.property && (
                                                    <div className="small text-muted">
                                                        <i className="bi bi-house me-1"></i> {post.scheduledPost.property.title}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 border-0">
                                                <div className="d-flex gap-1">
                                                    <span className="badge bg-light text-dark border p-2">
                                                        <i className={`bi bi-${post.platform?.toLowerCase() === 'facebook' ? 'facebook text-primary' :
                                                            post.platform?.toLowerCase() === 'instagram' ? 'instagram text-danger' :
                                                                post.platform?.toLowerCase() === 'twitter' ? 'twitter text-info' : 'globe'} me-1`}></i>
                                                        {post.platform}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-0">
                                                <div className="d-flex gap-3">
                                                    <span className="small"><i className="bi bi-heart-fill text-danger me-1"></i> {post.metrics?.likes || 0}</span>
                                                    <span className="small"><i className="bi bi-chat-fill text-primary me-1"></i> {post.metrics?.comments || 0}</span>
                                                    <span className="small"><i className="bi bi-share-fill text-success me-1"></i> {post.metrics?.shares || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-0">
                                                <div className="small fw-medium text-dark">{new Date(post.publishedAt).toLocaleDateString()}</div>
                                                <div className="small text-muted">{new Date(post.publishedAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-4 py-3 border-0 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        onClick={() => handleRefresh(post.id)}
                                                        className="btn btn-white btn-sm rounded-pill px-3 shadow-sm border"
                                                        title="Refresh metrics"
                                                    >
                                                        <i className="bi bi-arrow-clockwise"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => navigateTo(`/social/analytics?postId=${post.id}`)}
                                                        className="btn btn-light btn-sm rounded-pill px-3 border-0"
                                                    >
                                                        <i className="bi bi-bar-chart-fill me-1"></i> Insights
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            <i className="bi bi-send-x display-4 d-block mb-3 opacity-25"></i>
                                            No published content yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
