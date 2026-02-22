'use client';

import React from 'react';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { useRouter } from 'next/navigation';

export default function DiscoveryPortalPage() {
    const router = useRouter();

    return (
        <ModuleGuard moduleSlug="discovery">
            <MainLayout activePage="discovery">
                <div className="container-fluid py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="fw-bold h3 mb-1">Discovery Portal</h1>
                            <p className="text-muted small">Manage your property search engine, AI assistant, and filtering logic.</p>
                        </div>
                    </div>

                    <div className="row g-4">
                        {/* Status Card */}
                        <div className="col-md-8">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div className="bg-success bg-opacity-10 p-3 rounded-4">
                                            <i className="bi bi-search fs-3 text-success"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0">Search Engine Active</h5>
                                            <p className="text-muted small mb-0">Filtered discovery is enabled on 100% of your published channels.</p>
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-4 text-center">
                                                <div className="h4 fw-bold mb-1">0</div>
                                                <div className="extra-small text-muted text-uppercase fw-bold">Daily Searches</div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-4 text-center">
                                                <div className="h4 fw-bold mb-1">Low</div>
                                                <div className="extra-small text-muted text-uppercase fw-bold">Search Latency</div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-4 text-center">
                                                <div className="h4 fw-bold mb-1">Active</div>
                                                <div className="extra-small text-muted text-uppercase fw-bold">Filter Indexing</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h6 className="fw-bold mb-3 d-flex align-items-center">
                                    <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
                                    Quick Configs
                                </h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 shadow-sm rounded-4 hvr-grow-shadow cursor-pointer"
                                            onClick={() => router.push('/realestate-owner-admin/chatbot-config')}
                                        >
                                            <div className="card-body p-4 d-flex align-items-center gap-3">
                                                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                                    <i className="bi bi-robot text-info fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1">AI Assistant</h6>
                                                    <div className="text-muted extra-small">Configure AI responses & triage</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 shadow-sm rounded-4 hvr-grow-shadow cursor-pointer"
                                            onClick={() => router.push('/realestate-owner-admin/widgets')}
                                        >
                                            <div className="card-body p-4 d-flex align-items-center gap-3">
                                                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                                                    <i className="bi bi-funnel text-success fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1">Filter Rules</h6>
                                                    <div className="text-muted extra-small">Enable/Disable filters on widgets</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Search Activity (Mock) */}
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-0 p-4 pb-0">
                                    <h6 className="fw-bold mb-0">Search Insights</h6>
                                </div>
                                <div className="card-body p-4">
                                    <div className="text-center py-5">
                                        <i className="bi bi-graph-up-arrow display-4 text-muted opacity-25 mb-3"></i>
                                        <p className="text-muted small">Once users start searching your portals, data will appear here.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .extra-small { font-size: 0.75rem; }
                    .hvr-grow-shadow { transition: all 0.2s; }
                    .hvr-grow-shadow:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                    .cursor-pointer { cursor: pointer; }
                `}</style>
            </MainLayout>
        </ModuleGuard>
    );
}
