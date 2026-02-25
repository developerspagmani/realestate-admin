'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { scheduledPostsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';

interface ScheduledPost {
    id: string;
    title: string;
    description?: string; // Keep description as it might be used elsewhere or for future features, even if not rendered in the new table.
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    platforms: string[];
    property?: {
        title: string;
    };
}

interface PostStats {
    total?: number;
    scheduled?: number;
    posted?: number;
    drafts?: number;
}

export default function ScheduledPostsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PostStats>({});

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
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
                scheduledPostsApi.getAll(),
                scheduledPostsApi.getStats()
            ]);

            if (postsRes.success) {
                setPosts(postsRes.data.posts || []);
            }

            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishNow = async (id: string) => {
        if (!confirm('Publish this post now?')) return;

        try {
            const res = await scheduledPostsApi.publishNow(id);
            if (res.success) {
                alert('Post published successfully!');
                loadPosts();
            } else {
                alert(res.message || 'Failed to publish post');
            }
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this scheduled post?')) return;

        try {
            const res = await scheduledPostsApi.delete(id);
            if (res.success) {
                loadPosts();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
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

    if (loading) {
        return (
            <MainLayout activePage="social-scheduled">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <Loader size="md" message="Loading scheduled posts..." />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-scheduled">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Social Campaigns</h1>
                        <p className="text-muted small">Manage your upcoming campaigns and draft items</p>
                    </div>
                    <button
                        onClick={() => navigateTo('/social/campaigns/create')}
                        className="btn btn-primary rounded-pill px-4"
                    >
                        <i className="bi bi-plus-lg me-2"></i> Create Campaign
                    </button>
                </div>

                {/* Stats */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard label="Total Content" value={stats.total || 0} icon="bi-collection" color="primary" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Scheduled" value={stats.scheduled || 0} icon="bi-calendar-date" color="info" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Published" value={stats.posted || 0} icon="bi-send-check" color="success" />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Drafts" value={stats.drafts || 0} icon="bi-clipboard" color="warning" />
                    </div>
                </div>

                {/* Content Table */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4 pb-0">
                        <h5 className="fw-bold mb-0">Post Management</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Campaign Name</th>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Platforms</th>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Status</th>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Schedule</th>
                                        <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.length > 0 ? (
                                        posts.map((post) => (
                                            <tr key={post.id} className="transition-all">
                                                <td className="px-4 py-3 border-0">
                                                    <div className="fw-bold text-dark">{post.title}</div>
                                                    {post.property && (
                                                        <div className="small text-muted d-flex align-items-center gap-1">
                                                            <i className="bi bi-house-door"></i> {post.property.title}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 border-0">
                                                    <div className="d-flex gap-2">
                                                        {post.platforms.map((p) => (
                                                            <span key={p} className="badge bg-light text-dark border p-2">
                                                                <i className={`bi bi-${p.toLowerCase() === 'facebook' ? 'facebook text-primary' :
                                                                    p.toLowerCase() === 'instagram' ? 'instagram text-danger' :
                                                                        p.toLowerCase() === 'twitter' ? 'twitter text-info' : 'globe'}`}></i>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-0">
                                                    <span className={`badge rounded-pill bg-${getStatusColor(post.status)} bg-opacity-10 text-${getStatusColor(post.status)} fw-bold`}>
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 border-0">
                                                    <div className="small fw-medium">{new Date(post.scheduledDate).toLocaleDateString()}</div>
                                                    <div className="smaller text-muted">{post.scheduledTime}</div>
                                                </td>
                                                <td className="px-4 py-3 border-0 text-end">
                                                    <div className="dropdown">
                                                        <button className="btn btn-light btn-sm rounded-circle border-0" data-bs-toggle="dropdown">
                                                            <i className="bi bi-three-dots-vertical"></i>
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                                                            <li>
                                                                <button
                                                                    onClick={() => navigateTo(`/social/campaigns/${post.id}/edit`)}
                                                                    className="dropdown-item py-2"
                                                                >
                                                                    <i className="bi bi-pencil me-2"></i> Edit
                                                                </button>
                                                            </li>
                                                            {post.status.toUpperCase() === 'SCHEDULED' && (
                                                                <li>
                                                                    <button
                                                                        onClick={() => handlePublishNow(post.id)}
                                                                        className="dropdown-item py-2 text-success"
                                                                    >
                                                                        <i className="bi bi-send me-2"></i> Publish Now
                                                                    </button>
                                                                </li>
                                                            )}
                                                            <li><hr className="dropdown-divider" /></li>
                                                            <li>
                                                                <button
                                                                    onClick={() => handleDelete(post.id)}
                                                                    className="dropdown-item py-2 text-danger"
                                                                >
                                                                    <i className="bi bi-trash me-2"></i> Delete
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5">
                                                <i className="bi bi-journal-x display-4 text-muted opacity-25 d-block mb-3"></i>
                                                <div className="text-muted">No posts found in your feed</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .transition-all { transition: all 0.2s ease-in-out; }
                .smaller { font-size: 0.75rem; }
            `}</style>
        </MainLayout>
    );
}



