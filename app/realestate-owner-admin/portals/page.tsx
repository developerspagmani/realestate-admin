'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { portalService } from '@/app/services/api';
import { toast } from 'react-hot-toast';

interface PortalListing {
    id: string;
    portal: string;
    status: string;
    externalId?: string;
    lastSyncAt: string;
    property: {
        title: string;
        slug: string;
    };
}

export default function OwnerPortalsPage() {
    const [listings, setListings] = useState<PortalListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'config'>('listings');
    const [syncing, setSyncing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state for config
    const [config, setConfig] = useState({
        portal: '99ACRES',
        username: '',
        password: '',
        apiKey: ''
    });

    useEffect(() => {
        fetchListings();
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            const response = await portalService.getConnectedAccounts();
            if (response.success) {
                const accounts = response.data.accounts || [];
                const acct = accounts.find((a: any) => a.platform === 'NINETYNINE_ACRES');
                if (acct) {
                    setConfig(prev => ({ ...prev, username: acct.platformAccountId, password: acct.accessToken }));
                }
            }
        } catch (e) { console.error('Error fetching creds', e); }
    };

    const fetchListings = async () => {
        try {
            const response = await portalService.getListings();
            if (response.success) {
                setListings(response.data);
            }
        } catch (error) {
            console.error('Fetch listings error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await portalService.updateCredentials(config);
            if (response.success) {
                toast.success('Configuration updated successfully!');
                setActiveTab('listings');
            }
        } catch (e) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleSyncLeads = async (portal: string) => {
        setSyncing(true);
        try {
            const response = await portalService.syncLeads(portal);
            if (response.success) {
                toast.success(response.message);
            }
        } catch (error) {
            toast.error('Failed to sync leads');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <MainLayout activePage="portals">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Portal Marketplace</h2>
                        <p className="text-muted">Boost your visibility on 99acres & MagicBricks</p>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-header bg-white p-0 border-0">
                        <ul className="nav nav-pills p-3 gap-2">
                            <li className="nav-item">
                                <button className={`nav-link rounded-pill px-4 ${activeTab === 'listings' ? 'active shadow-sm btn-dark text-white' : ''}`} onClick={() => setActiveTab('listings')}>
                                    <i className="bi bi-list-task me-2"></i> Listings
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link rounded-pill px-4 ${activeTab === 'config' ? 'active shadow-sm btn-dark text-white' : ''}`} onClick={() => setActiveTab('config')}>
                                    <i className="bi bi-gear-fill me-2"></i> Configuration
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {activeTab === 'listings' ? (
                    <>
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <StatCard
                                    label="Active Listings"
                                    value={listings.filter(l => l.status === 'PUBLISHED').length}
                                    icon="bi-cloud-arrow-up"
                                    color="success"
                                />
                            </div>
                            <div className="col-md-4">
                                <StatCard
                                    label="Recent Leads"
                                    value="42"
                                    icon="bi-person-heart"
                                    color="primary"
                                />
                            </div>
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm h-100 rounded-4 p-4 d-flex flex-column justify-content-center align-items-center bg-white text-white">
                                    <h5 className="mb-3">Manual Sync</h5>
                                    <button
                                        className="btn btn-dark rounded-pill px-4 shadow-sm fw-bold"
                                        onClick={() => handleSyncLeads('99ACRES')}
                                        disabled={syncing}
                                    >
                                        {syncing ? 'Syncing...' : 'Fetch New Leads'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4">My Property</th>
                                                <th>Target Portal</th>
                                                <th>Status</th>
                                                <th>External ID</th>
                                                <th>Last Update</th>
                                                <th className="pe-4 text-end">Options</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={6} className="text-center py-4 text-muted">Scanning portals...</td></tr>
                                            ) : listings.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-4 text-muted">No properties published yet.</td></tr>
                                            ) : (
                                                listings.map((listing) => (
                                                    <tr key={listing.id}>
                                                        <td className="ps-4">
                                                            <div className="fw-bold">{listing.property.title}</div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-soft-primary text-primary rounded-pill px-3">
                                                                {listing.portal}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill px-3 ${listing.status === 'PUBLISHED' ? 'bg-success' :
                                                                listing.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                                                                }`}>
                                                                {listing.status}
                                                            </span>
                                                        </td>
                                                        <td><code>{listing.externalId || 'PE-99021'}</code></td>
                                                        <td>{new Date(listing.lastSyncAt).toLocaleDateString()}</td>
                                                        <td className="pe-4 text-end">
                                                            <button className="btn btn-sm btn-outline-primary rounded-pill me-2">
                                                                Refresh
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <div className="text-center mb-4">
                                    <div className="bg-dark text-white rounded-4 d-inline-flex p-3 mb-3">
                                        <i className="bi bi-shield-lock fs-2"></i>
                                    </div>
                                    <h4 className="fw-bold">99Acres Connection</h4>
                                    <p className="text-muted">Enter your corporate credentials to enable lead sync and property posting</p>
                                </div>

                                <form onSubmit={handleSaveConfig}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Username / Client ID</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3"
                                            placeholder="e.g., your_company_user"
                                            value={config.username}
                                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted">Password / API Secret</label>
                                        <input
                                            type="password"
                                            className="form-control rounded-3"
                                            placeholder="••••••••"
                                            value={config.password}
                                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="alert alert-info border-0 rounded-4 small mb-4">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Leads will be polled automatically every 6 hours once credentials are saved.
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm"
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Connect 99Acres'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .bg-soft-primary { background-color: rgba(13, 110, 253, 0.1); }
                .nav-pills .nav-link.active { background-color: var(--bs-primary); }
                .nav-pills .nav-link { color: #6c757d; font-weight: 500; }
            `}</style>
        </MainLayout>
    );
}
