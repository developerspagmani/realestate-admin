'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

export default function CreateCampaignPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
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
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsRes, propertiesRes] = await Promise.all([
                connectedAccountsApi.getAll(),
                loadProperties()
            ]);

            if (accountsRes.success) {
                setConnectedAccounts(accountsRes.data.accounts || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProperties = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const res = await propertyService.getProperties(token);
            if (res.success) {
                const rawProps = res.data?.properties || res.data || [];
                const formattedProps = rawProps.map((p: any) => ({
                    id: p.id,
                    name: p.title || p.name || 'Untitled Property'
                }));
                setProperties(formattedProps);
            }
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    };

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!formData.propertyId) return;

            try {
                const token = getAuthToken();
                if (!token) return;

                const res = await propertyService.getPropertyById(token, formData.propertyId);
                if (res.success && res.data) {
                    const prop = res.data;
                    setFormData(prev => ({
                        ...prev,
                        title: prev.title || `Introducing ${prop.title}`,
                        description: prev.description || `${prop.title} is located in ${prop.city}, ${prop.state}. ${prop.description || ''}`,
                        hashtags: prev.hashtags || `#${prop.title.replace(/\s+/g, '')} #RealEstate #${prop.city} #PropertyListing`,
                        mediaUrls: prop.mainImage?.url ? [prop.mainImage.url] : prev.mediaUrls
                    }));
                }
            } catch (error) {
                console.error('Error fetching property details:', error);
            }
        };

        fetchPropertyDetails();
    }, [formData.propertyId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (formData.platforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        try {
            setLoading(true);
            const res = await scheduledPostsApi.create(formData);

            if (res.success) {
                alert('Campaign scheduled successfully!');
                navigateTo('/social/scheduled');
            } else {
                alert(res.message || 'Failed to schedule campaign');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePublishNow = async () => {
        if (formData.platforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        try {
            setLoading(true);
            // First create as draft or just use a dedicated publish endpoint if available
            // For now, let's create and then publish, or use a "publishNow" in data if backend supports it
            const res = await scheduledPostsApi.create({
                ...formData,
                status: 'POSTED',
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
            });

            if (res.success) {
                alert('Campaign published successfully!');
                navigateTo('/social/analytics');
            } else {
                alert(res.message || 'Failed to publish campaign');
            }
        } catch (error) {
            console.error('Error publishing campaign:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            setLoading(true);
            const res = await scheduledPostsApi.createDraft(formData);

            if (res.success) {
                alert('Draft saved successfully!');
                navigateTo('/social/scheduled?status=DRAFT');
            } else {
                alert(res.message || 'Failed to save draft');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
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

    const availablePlatforms = [...new Set(connectedAccounts.map(a => a.platform))];

    const getPlatformIcon = (platform: string) => {
        switch (platform.toUpperCase()) {
            case 'FACEBOOK': return 'bi-facebook';
            case 'INSTAGRAM': return 'bi-instagram';
            case 'GOOGLE': return 'bi-google';
            case 'TWITTER': return 'bi-twitter-x';
            case 'LINKEDIN': return 'bi-linkedin';
            default: return 'bi-share';
        }
    };

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
                                Back to Social
                            </button>
                            <h1 className="fw-bold h2 mb-1">Create Campaign</h1>
                            <p className="text-muted small">Target properties and schedule posts across platforms</p>
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
                                            placeholder="What's on your mind? Write your post content here..."
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
                                            placeholder="#realestate #property #dreamhome"
                                        />
                                    </div>

                                    {/* Platforms */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Select Platforms *
                                        </label>
                                        {availablePlatforms.length > 0 ? (
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
                                        ) : (
                                            <div className="p-4 bg-light rounded-4 text-center">
                                                <p className="text-muted small mb-3">No connected accounts found.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => navigateTo('/social/accounts')}
                                                    className="btn btn-outline-primary btn-sm rounded-pill px-4"
                                                >
                                                    Connect accounts
                                                </button>
                                            </div>
                                        )}
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
                                            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
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
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={loading}
                                    className="btn btn-outline-dark rounded-pill px-5 order-3 order-md-2"
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    ) : (
                                        <i className="bi bi-save me-2"></i>
                                    )}
                                    Save as Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('previewPostData', JSON.stringify(formData));
                                        router.push(`${basePath}/social/campaigns/preview`);
                                    }}
                                    className="btn btn-outline-primary border-0 rounded-pill px-4 hvr-scale order-md-2"
                                >
                                    <i className="bi bi-eye me-2"></i> Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePublishNow}
                                    disabled={loading}
                                    className="btn btn-success rounded-pill px-5 order-2 order-md-3"
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    ) : (
                                        <i className="bi bi-send me-2"></i>
                                    )}
                                    Publish Now
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary rounded-pill px-5 order-1 order-md-4"
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    ) : (
                                        <i className="bi bi-calendar-check me-2"></i>
                                    )}
                                    Schedule Campaign
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


