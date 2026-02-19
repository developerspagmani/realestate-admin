'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { scheduledPostsApi, connectedAccountsApi } from '@/lib/api/social';

interface ConnectedAccount {
    id: string;
    platform: string;
    accountName: string;
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
    const [loading, setLoading] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
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
        loadConnectedAccounts();
    }, []);

    const loadConnectedAccounts = async () => {
        try {
            const res = await connectedAccountsApi.getAll();
            if (res.success) {
                setConnectedAccounts(res.data.accounts || []);
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
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
            const res = await scheduledPostsApi.create(formData);

            if (res.success) {
                alert('Campaign created successfully!');
                navigateTo('/social/scheduled');
            } else {
                alert(res.message || 'Failed to create campaign');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
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

    const togglePlatform = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    const availablePlatforms = [...new Set(connectedAccounts.map(a => a.platform))];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
                <p className="text-gray-600 mt-1">Schedule posts across multiple platforms</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter campaign title"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter post description"
                    />
                </div>

                {/* Hashtags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hashtags
                    </label>
                    <input
                        type="text"
                        value={formData.hashtags}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, hashtags: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#realestate #property"
                    />
                </div>

                {/* Platforms */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Platforms *
                    </label>
                    {availablePlatforms.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {availablePlatforms.map((platform) => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => togglePlatform(platform)}
                                    className={`p-3 border-2 rounded-lg transition-all ${formData.platforms.includes(platform)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-medium">{platform}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            No connected accounts. <button
                                type="button"
                                onClick={() => navigateTo('/social/accounts')}
                                className="text-blue-600 hover:underline"
                            >Connect accounts</button>
                        </p>
                    )}
                </div>

                {/* Schedule Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Schedule Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.scheduledDate}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Schedule Time *
                        </label>
                        <input
                            type="time"
                            required
                            value={formData.scheduledTime}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Media URLs */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Media URLs (comma-separated)
                    </label>
                    <input
                        type="text"
                        value={formData.mediaUrls.join(', ')}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({
                            ...formData,
                            mediaUrls: e.target.value.split(',').map(url => url.trim()).filter(Boolean)
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                </div>

                {/* Media Type */}
                <div className="flex space-x-6">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isVideo}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isVideo: e.target.checked, isCarousel: false })}
                            className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Video Post</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isCarousel}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isCarousel: e.target.checked, isVideo: false })}
                            className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Carousel (Multiple Images)</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Save as Draft'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Schedule Campaign'}
                    </button>
                </div>
            </form>
        </div>
    );
}
