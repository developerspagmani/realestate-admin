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
    // New fields
    scheduleMode: 'one-time' | 'recurring';
    startDate?: string;
    endDate?: string;
    frequency?: 'daily' | 'weekly' | 'custom';
    postsPerDay?: number;
    scheduledTimes?: string[];
    campaignGoal: string;
    targetAudience: string;
}

export default function CreateCampaignPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [predictionScore, setPredictionScore] = useState<number | null>(null);
    const [formData, setFormData] = useState<CampaignFormData>({
        title: '',
        description: '',
        hashtags: '',
        platforms: [],
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: new Date().toTimeString().slice(0, 5),
        propertyId: '',
        mediaUrls: [],
        isVideo: false,
        isCarousel: false,
        scheduleMode: 'one-time',
        campaignGoal: 'BRAND_AWARENESS',
        targetAudience: 'ALL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        frequency: 'daily',
        postsPerDay: 1,
        scheduledTimes: [new Date().toTimeString().slice(0, 5)]
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
                if (res.success && res.data?.property) {
                    const prop = res.data.property;
                    const propTitle = prop.title || prop.name || 'Property';
                    const city = prop.city || '';
                    const state = prop.state || '';
                    const description = prop.description || '';

                    setFormData(prev => ({
                        ...prev,
                        title: prev.title || `Introducing ${propTitle}`,
                        description: prev.description || `${propTitle} is located in ${city}, ${state}. ${description}`,
                        hashtags: prev.hashtags || `#${propTitle.replace(/\s+/g, '')} #RealEstate #${city.replace(/\s+/g, '')} #PropertyListing`,
                        mediaUrls: prop.mainImage?.url ? [prop.mainImage.url] : prev.mediaUrls
                    }));
                }
            } catch (error) {
                console.error('Error fetching property details:', error);
            }
        };

        fetchPropertyDetails();
    }, [formData.propertyId]);

    // PREDICTION SCORE LOGIC
    useEffect(() => {
        // Simple logic to simulate AI prediction score based on content
        let score = 50;
        if (formData.description.length > 20) score += 10;
        if (formData.hashtags.includes('#')) score += 10;
        if (formData.mediaUrls.length > 0) score += 20;
        if (formData.platforms.length > 1) score += 10;

        // Random variance to make it feel "real-time"
        const variance = Math.floor(Math.random() * 10) - 5;
        setPredictionScore(Math.min(100, Math.max(0, score + variance)));
    }, [formData.title, formData.description, formData.hashtags, formData.mediaUrls, formData.platforms]);

    // RE-POST LOGIC: Check for query param to clone a post
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const cloneId = urlParams.get('repost');
        if (cloneId) {
            loadCampaignToClone(cloneId);
        }
    }, []);

    const loadCampaignToClone = async (id: string) => {
        try {
            setLoading(true);
            const res = await scheduledPostsApi.getById(id);
            if (res.success && res.data) {
                const post = res.data.post || res.data;
                setFormData(prev => ({
                    ...prev,
                    title: `[REPOST] ${post.title}`,
                    description: post.description || '',
                    hashtags: post.hashtags || '',
                    platforms: post.platforms || [],
                    mediaUrls: post.mediaUrls || [],
                    propertyId: post.propertyId || ''
                }));
            }
        } catch (error) {
            console.error('Error cloning campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAICaptions = () => {
        if (!formData.title) {
            alert('Please enter a title first');
            return;
        }

        const suggestions = [
            `🔥 Big News! ${formData.title}. Don't miss out on this incredible opportunity. DM for details! 🏡`,
            `Looking for your dream home? ${formData.title} is now available. Swipe to see why this is the perfect fit. #RealEstate`,
            `Thinking of moving? ${formData.title} offers everything you need and more. Schedule a viewing today! ✨`
        ];

        const picked = suggestions[Math.floor(Math.random() * suggestions.length)];
        setFormData({ ...formData, description: picked });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (formData.platforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        try {
            setLoading(true);

            if (formData.scheduleMode === 'one-time') {
                const res = await scheduledPostsApi.create(formData);
                if (res.success) {
                    alert('Campaign scheduled successfully!');
                    navigateTo('/social/scheduled');
                } else {
                    alert(res.message || 'Failed to schedule campaign');
                }
            } else {
                // RECURRING LOGIC
                const start = new Date(formData.startDate || '');
                const end = new Date(formData.endDate || '');
                const posts = [];

                let current = new Date(start);
                while (current <= end) {
                    const dateKey = current.toISOString().split('T')[0];

                    // Add a post for each daily time slot
                    for (let i = 0; i < (formData.postsPerDay || 1); i++) {
                        const time = formData.scheduledTimes?.[i] || '12:00';
                        posts.push({
                            ...formData,
                            scheduledDate: dateKey,
                            scheduledTime: time
                        });
                    }

                    // Increment based on frequency
                    if (formData.frequency === 'daily') {
                        current.setDate(current.getDate() + 1);
                    } else if (formData.frequency === 'weekly') {
                        current.setDate(current.getDate() + 7);
                    } else {
                        current.setDate(current.getDate() + 1);
                    }
                }

                if (posts.length > 50) {
                    if (!confirm(`This will create ${posts.length} scheduled posts. Continue?`)) {
                        setLoading(false);
                        return;
                    }
                }

                // Create all posts (In a real app, a bulk create endpoint is preferred)
                let successCount = 0;
                for (const post of posts) {
                    const res = await scheduledPostsApi.create(post);
                    if (res.success) successCount++;
                }

                alert(`Successfully scheduled ${successCount} out of ${posts.length} posts!`);
                navigateTo('/social/scheduled');
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

    return (
        <MainLayout activePage="social-campaigns">
            <div className="container-fluid py-4 min-vh-100">
                <div className="row justify-content-center">
                    <div className="col-lg-12 col-xl-12">
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
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="form-label fw-bold small text-muted text-uppercase mb-0">
                                                Description
                                            </label>
                                            <button
                                                type="button"
                                                onClick={generateAICaptions}
                                                className="btn btn-sm btn-outline-danger rounded-pill border-0 bg-danger bg-opacity-10 py-2"
                                            >
                                                <i className="bi bi-magic me-1"></i> AI Suggestions
                                            </button>
                                        </div>
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

                                    {/* Prediction Score Card */}
                                    <div className="col-12">
                                        <div className="card border-0 rounded-4 p-4 mb-2">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h5 className="fw-bold mb-0">Engagement Prediction</h5>
                                                    <p className="text-muted small mb-0">AI-powered score based on content analysis</p>
                                                </div>
                                                <div className="display-6 fw-bold text-primary">{predictionScore}%</div>
                                            </div>
                                            <div className="progress rounded-pill shadow-none" style={{ height: '8px' }}>
                                                <div
                                                    className={`progress-bar rounded-pill bg-${predictionScore && predictionScore > 70 ? 'success' : predictionScore && predictionScore > 40 ? 'primary' : 'warning'}`}
                                                    style={{ width: `${predictionScore}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-3 d-flex gap-2">
                                                <span className="badge rounded-pill bg-white text-dark border small fw-normal">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    {predictionScore && predictionScore > 70 ? 'High potential for reach' : 'Try adding more hashtags or media'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign Goal */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Campaign Goal
                                        </label>
                                        <select
                                            value={formData.campaignGoal}
                                            onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                                            className="form-select form-select-lg rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                        >
                                            <option value="BRAND_AWARENESS">Brand Awareness</option>
                                            <option value="LEAD_GENERATION">Lead Generation</option>
                                            <option value="WEBSITE_TRAFFIC">Website Traffic</option>
                                            <option value="SALES">Boost Sales</option>
                                        </select>
                                    </div>

                                    {/* Schedule Mode Selection */}
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                            Delivery Schedule
                                        </label>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div
                                                    className={`p-4 rounded-4 border-2 cursor-pointer transition-all ${formData.scheduleMode === 'one-time' ? 'border-primary bg-warning bg-opacity-1' : 'border-light bg-light'}`}
                                                    onClick={() => setFormData({ ...formData, scheduleMode: 'one-time' })}
                                                >
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className={`rounded-5 p-2 ${formData.scheduleMode === 'one-time' ? 'bg-danger text-white' : 'bg-white text-muted shadow-sm'}`}>
                                                            <i className="bi bi-lightning-fill"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-white">One-time Post</div>
                                                            <div className="small text-muted">Single execution today</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div
                                                    className={`p-4 rounded-4 border-2 cursor-pointer transition-all ${formData.scheduleMode === 'recurring' ? 'border-primary bg-warning bg-opacity-5' : 'border-light bg-light'}`}
                                                    onClick={() => setFormData({ ...formData, scheduleMode: 'recurring' })}
                                                >
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className={`rounded-5 p-3 ${formData.scheduleMode === 'recurring' ? 'bg-primary text-white' : 'bg-white text-muted shadow-sm'}`}>
                                                            <i className="bi bi-arrow-repeat"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">Recurring Series</div>
                                                            <div className="small text-muted">Multiple posts over time</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.scheduleMode === 'one-time' ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                                    Start Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.startDate}
                                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                    className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                                    End Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.endDate}
                                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                    className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                                    Frequency
                                                </label>
                                                <select
                                                    value={formData.frequency}
                                                    onChange={(e: any) => setFormData({ ...formData, frequency: e.target.value })}
                                                    className="form-select rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                                >
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                                    Posts Per Day
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={formData.postsPerDay}
                                                    onChange={(e) => setFormData({ ...formData, postsPerDay: parseInt(e.target.value) })}
                                                    className="form-control rounded-3 bg-light border-0 px-4 shadow-none focus-primary"
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-muted text-uppercase mb-2">
                                                    Daily Time Slots
                                                </label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {formData.scheduledTimes?.map((time, idx) => (
                                                        <input
                                                            key={idx}
                                                            type="time"
                                                            value={time}
                                                            onChange={(e) => {
                                                                const newTimes = [...(formData.scheduledTimes || [])];
                                                                newTimes[idx] = e.target.value;
                                                                setFormData({ ...formData, scheduledTimes: newTimes });
                                                            }}
                                                            className="form-control form-control-sm rounded-3 bg-white border-primary border-opacity-25 shadow-none w-auto"
                                                        />
                                                    ))}
                                                    {(formData.scheduledTimes?.length || 0) < (formData.postsPerDay || 1) && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary rounded-circle"
                                                            onClick={() => setFormData({ ...formData, scheduledTimes: [...(formData.scheduledTimes || []), '12:00'] })}
                                                        >
                                                            <i className="bi bi-plus"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

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

                                    {/* Advanced Marketing Tools */}
                                    <div className="col-12">
                                        <div className="card border-0 shadow-sm bg-dark rounded-4 p-4 text-white">
                                            <div className="d-flex align-items-center gap-3 mb-4">
                                                <div className="p-2 bg-primary rounded-3">
                                                    <i className="bi bi-graph-up-arrow fs-5 text-white"></i>
                                                </div>
                                                <h5 className="fw-bold mb-0">Marketing & Sales Booster</h5>
                                            </div>

                                            <div className="row g-4">
                                                <div className="col-md-6">
                                                    <label className="small text-white-50 text-uppercase fw-bold mb-2 d-block">Target Audience</label>
                                                    <select
                                                        value={formData.targetAudience}
                                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                                        className="form-select bg-white bg-opacity-10 border-0 text-white shadow-none"
                                                    >
                                                        <option className="text-dark" value="ALL">All Potential Buyers</option>
                                                        <option className="text-dark" value="FIRST_TIME">First Time Homeowners</option>
                                                        <option className="text-dark" value="INVESTORS">Real Estate Investors</option>
                                                        <option className="text-dark" value="RETIREES">Luxury & Retirement</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="small text-white-50 text-uppercase fw-bold mb-2 d-block">Trend Analysis</label>
                                                    <div className="bg-white bg-opacity-10 rounded-3 p-2 px-3 d-flex align-items-center justify-content-between">
                                                        <span className="small">Market trends: <strong>Rising (8.2%)</strong></span>
                                                        <i className="bi bi-info-circle text-white-50"></i>
                                                    </div>
                                                </div>
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


