'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { portalService } from '@/app/services/api';
import Toast from '@/components/common/Toast';

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

export default function PortalsPage() {
    const [listings, setListings] = useState<PortalListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };


    useEffect(() => {
        fetchListings();
    }, []);

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

    const handleSyncLeads = async (portal: string) => {
        setSyncing(true);
        try {
            const response = await portalService.syncLeads(portal);
            if (response.success) {
                showToast(response.message);
            }
        } catch (error) {
            showToast('Failed to sync leads', 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <MainLayout activePage="portals">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Global Portal Hub</h2>
                        <p className="text-muted">Monitor and sync listings across all tenant property portals</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold transition-all"
                            onClick={() => handleSyncLeads('99ACRES')}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Syncing...</>
                            ) : (
                                <><i className="bi bi-arrow-repeat me-2"></i>Global 99Acres Sync</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    <div className="col-md-4">
                        <StatCard
                            label="Active Listings"
                            value={listings.filter(l => l.status === 'PUBLISHED').length}
                            icon="bi-cloud-arrow-up"
                            color="primary"
                        />
                    </div>
                    <div className="col-md-4">
                        <StatCard
                            label="Total Portal Leads"
                            value="1,428"
                            icon="bi-people-fill"
                            color="success"
                        />
                    </div>
                    <div className="col-md-4">
                        <StatCard
                            label="Failed Syncs"
                            value={listings.filter(l => l.status === 'FAILED').length}
                            icon="bi-exclamation-triangle-fill"
                            color="danger"
                        />
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white py-4 border-0 px-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0 fw-bold">Live Portal Synchronizations</h5>
                            <p className="text-muted small mb-0">Real-time status of cross-platform property listings</p>
                        </div>
                        <div className="input-group" style={{ width: '250px' }}>
                            <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                            <input type="text" className="form-control bg-light border-0" placeholder="Filter property..." />
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Property & Slug</th>
                                        <th>Portal</th>
                                        <th>Status</th>
                                        <th>External Reference</th>
                                        <th>Last Sync Timestamp</th>
                                        <th className="pe-4 text-end">Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-5">
                                            <div className="spinner-border text-primary mb-2"></div>
                                            <div className="text-muted">Fetching global portal data...</div>
                                        </td></tr>
                                    ) : listings.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-5 text-muted">
                                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                                            No external listings found across the network.
                                        </td></tr>
                                    ) : (
                                        listings.map((listing) => (
                                            <tr key={listing.id}>
                                                <td className="ps-4 py-3">
                                                    <div className="fw-bold text-dark">{listing.property.title}</div>
                                                    <div className="text-muted small">/{listing.property.slug}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-soft-info text-info rounded-pill px-3 py-2 fw-semibold">
                                                        <i className="bi bi-globe me-1"></i> {listing.portal}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill px-3 py-2 fw-semibold ${listing.status === 'PUBLISHED' ? 'bg-success' :
                                                        listing.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                                                        }`}>
                                                        <i className={`bi ${listing.status === 'PUBLISHED' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-1`}></i>
                                                        {listing.status}
                                                    </span>
                                                </td>
                                                <td><code className="bg-light p-1 rounded text-dark px-2">{listing.externalId || 'HUB-REF-ERR'}</code></td>
                                                <td>{new Date(listing.lastSyncAt).toLocaleString()}</td>
                                                <td className="pe-4 text-end">
                                                    <div className="btn-group shadow-sm rounded-pill overflow-hidden">
                                                        <button className="btn btn-sm btn-white border-0 px-3 hover-bg-light">
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-white border-0 px-3 hover-bg-light">
                                                            <i className="bi bi-three-dots"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .bg-soft-info { background-color: rgba(13, 202, 240, 0.1); }
                .hover-bg-light:hover { background-color: #f8f9fa; }
                .transition-all { transition: all 0.2s; }
            `}</style>
        </MainLayout>
    );
}
