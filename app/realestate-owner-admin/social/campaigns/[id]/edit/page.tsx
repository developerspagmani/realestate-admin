'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { scheduledPostsApi, connectedAccountsApi } from '@/lib/api/social';
import { propertyService, getAuthToken } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';

interface ConnectedAccount {
    id: string;
    platform: string;
    accountName: string;
}

interface Property {
    id: string;
    name: string;
}

interface CampaignFormData {
    title: string;
    description: string;
    hashtags: string;
    platforms: string[];
    scheduledDate: string;
    scheduledTime: string;
    propertyId: string;
    mediaUrls: string[];
    isVideo: boolean;
    isCarousel: boolean;
}

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const id = params.id as string;
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [formData, setFormData] = useState<CampaignFormData>({
        title: '',
        description: '',
        hashtags: '',
        platforms: [],
        scheduledDate: '',
        scheduledTime: '',
        propertyId: '',
        mediaUrls: [],
        isVideo: false,
        isCarousel: false
    });

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadInitialData();
    }, [id]);

    const loadInitialData = async () => {
        try {
            setFetching(true);
            const [accountsRes, propertiesRes, campaignRes] = await Promise.all([
                connectedAccountsApi.getAll(),
                loadProperties(),
                scheduledPostsApi.getById(id)
            ]);

            if (accountsRes.success) {
                setConnectedAccounts(accountsRes.data.accounts || []);
            }

            if (campaignRes.success && campaignRes.data) {
                const campaign = campaignRes.data.post || campaignRes.data;

                // Format date for input: YYYY-MM-DD
                let dateStr = '';
                if (campaign.scheduledDate) {
                    dateStr = new Date(campaign.scheduledDate).toISOString().split('T')[0];
                }

                setFormData({
                    title: campaign.title || '',
                    description: campaign.description || '',
                    hashtags: campaign.hashtags || '',
                    platforms: campaign.platforms || [],
                    scheduledDate: dateStr,
                    scheduledTime: campaign.scheduledTime || '',
                    propertyId: campaign.propertyId || '',
                    mediaUrls: campaign.mediaUrls || [],
                    isVideo: campaign.isVideo || false,
                    isCarousel: campaign.isCarousel || false
                });
            } else {
                alert('Campaign not found');
                router.back();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('An error occurred while loading campaign data');
        } finally {
            setFetching(false);
        }
    };

    const loadProperties = async () => {
        try {
            const token = getAuthToken();
            if (!token) return [];

            const res = await propertyService.getProperties(token);
            if (res.success) {
                const rawProps = res.data?.properties || res.data || [];
                const formattedProps = rawProps.map((p: any) => ({
                    id: p.id,
                    name: p.title || p.name || 'Untitled Property'
                }));
                setProperties(formattedProps);
                return formattedProps;
            }
        } catch (error) {
            console.error('Error loading properties:', error);
        }
        return [];
    };

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (formData.platforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        try {
            setLoading(true);
            const res = await scheduledPostsApi.update(id, formData);

            if (res.success) {
                alert('Campaign updated successfully!');
                navigateTo(`/social/campaigns/${id}`);
            } else {
                alert(res.message || 'Failed to update campaign');
            }
        } catch (error) {
            console.error('Error updating campaign:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    const availablePlatforms = [...new Set(connectedAccounts.map(a => a.platform).filter(Boolean))];

    const getPlatformIcon = (platform: string) => {
        if (!platform) return 'bi-share';
        switch (platform.toUpperCase()) {
            case 'FACEBOOK': return 'bi-facebook';
            case 'INSTAGRAM': return 'bi-instagram';
            case 'GOOGLE': return 'bi-google';
            case 'TWITTER': return 'bi-twitter-x';
            case 'LINKEDIN': return 'bi-linkedin';
            default: return 'bi-share';
        }
    };

    if (fetching) {
        return (
            <MainLayout activePage="social-campaigns">
                <div className="d-flex align-items-center justify-content-center min-vh-100">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-campaigns">
            <div className="container-fluid py-4 min-vh-100">
                <div className="row justify-content-center">
                    <div className="col-lg-10 col-xl-8">
                        {/* Header */}
                        <div className="mb-4">
                            <button
                                onClick={() => router.back()}
                                className="btn btn-link text-muted p-0 mb-2 text-decoration-none small d-flex align-items-center gap-1"
                            >
                                <i className="bi bi-arrow-left"></i>
                                Back to Details
                            </button>
                            <h1 className="fw-bold h2 mb-1">Edit Campaign</h1>
                            <p className="text-muted small">Update your campaign details and schedule</p>
                        </div>

                        <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 p-md-5">
                                <div className="row g-4">
                                    {/* Select Property */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Select Property
                                        </label>
                                        <select
                                            value={formData.propertyId}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, propertyId: e.target.value })}
                                            className="form-select form-select-lg rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                        >
                                            <option value="">General Campaign (No specific property)</option>
                                            {properties.map(property => (
                                                <option key={property.id} value={property.id}>
                                                    {property.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Title */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Campaign Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                                            className="form-control form-control-lg rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                            placeholder="Enter campaign title"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                            placeholder="What's on your mind?"
                                        />
                                    </div>

                                    {/* Hashtags */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Hashtags
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.hashtags}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, hashtags: e.target.value })}
                                            className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                            placeholder="#realestate #property"
                                        />
                                    </div>

                                    {/* Platforms */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Select Platforms *
                                        </label>
                                        <div className="row g-2">
                                            {availablePlatforms.map((platform) => (
                                                <div key={platform} className="col-6 col-md-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConnect(platform)}
                                                        className={`btn w-100 p-3 rounded-4 border-2 transition-all d-flex align-items-center justify-content-center gap-2 ${formData.platforms.includes(platform)
                                                            ? 'btn-primary border-primary'
                                                            : 'btn-outline-light text-muted border-light border-1'
                                                            }`}
                                                    >
                                                        <i className={`bi ${getPlatformIcon(platform)} fs-5`}></i>
                                                        <span className="small fw-bold">{platform}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Schedule Date & Time */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Schedule Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.scheduledDate}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Schedule Time *
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.scheduledTime}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                            className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                        />
                                    </div>

                                    {/* Media URLs */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Media URLs (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={(formData.mediaUrls || []).join(', ')}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({
                                                ...formData,
                                                mediaUrls: e.target.value.split(',').map(url => url.trim()).filter(Boolean)
                                            })}
                                            className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                            placeholder="https://example.com/image1.jpg"
                                        />
                                    </div>

                                    {/* Media Type */}
                                    <div className="col-12">
                                        <div className="d-flex flex-wrap gap-4 p-3 bg-light rounded-4">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    id="isVideo"
                                                    checked={formData.isVideo}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isVideo: e.target.checked, isCarousel: false })}
                                                    className="form-check-input"
                                                />
                                                <label className="form-check-label small fw-bold" htmlFor="isVideo">
                                                    Video Post
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    id="isCarousel"
                                                    checked={formData.isCarousel}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isCarousel: e.target.checked, isVideo: false })}
                                                    className="form-check-input"
                                                />
                                                <label className="form-check-label small fw-bold" htmlFor="isCarousel">
                                                    Carousel (Multiple Images)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="card-footer bg-light border-0 p-4 p-md-5 d-flex flex-column flex-md-row justify-content-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="btn btn-link text-muted text-decoration-none px-4 order-4 order-md-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary rounded-pill px-5 order-1 order-md-4"
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    ) : (
                                        <i className="bi bi-save me-2"></i>
                                    )}
                                    Update Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .focus-primary:focus {
                    background-color: white !important;
                    border: 2px solid #0d6efd !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
        </MainLayout>
    );
}
