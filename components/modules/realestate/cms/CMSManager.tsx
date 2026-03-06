'use client';

import { Page } from '@/app/services/cms';
import { MediaItem } from '@/types';
import React, { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { cmsService } from '@/app/services/cms';
import { mediaService } from '@/app/services/media';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import CMSForm from '@/components/modules/realestate/cms/CMSForm';
import CMSList from '@/components/modules/realestate/cms/CMSList';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';

interface CMSManagerProps {
    mode?: 'admin' | 'owner';
}



export default function CMSManager({ mode = 'owner' }: CMSManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const loadPages = useCallback(async () => {
        try {
            setLoading(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const response = await cmsService.getPages(token, tenantId || undefined);
            if (response.success) {
                setPages(response.data);
            }
        } catch (error) {
            console.error('Failed to load pages:', error);
            showToast('Failed to load pages', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTenantId, mode, user?.tenantId]);

    const loadMedia = useCallback(async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const response = await mediaService.getMedia(token, { tenantId: tenantId || undefined });
            if (response.success) {
                // Handle both paginated and non-paginated responses
                const items = Array.isArray(response.data) ? response.data : (response.data?.media || []);
                setMediaItems(items);
            }
        } catch (error) {
            console.error('Failed to load media:', error);
        }
    }, [activeTenantId, mode, user?.tenantId]);

    useEffect(() => {
        if (isAuthenticated) {
            loadPages();
            loadMedia();
        }
    }, [isAuthenticated, activeTenantId, loadPages, loadMedia]);

    const handleSubmit = async (data: Partial<Page>) => {
        try {
            let response;
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;

            const finalData = {
                ...data,
                tenantId: tenantId || undefined
            };

            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
            if (editingPage) {
                response = await cmsService.updatePage(token, editingPage.id, finalData, tenantId || undefined);
            } else {
                response = await cmsService.createPage(token, finalData);
            }

            if (response.success) {
                setShowForm(false);
                setEditingPage(null);
                loadPages();
                showToast(editingPage ? 'Page updated successfully' : 'Page created successfully');
            } else {
                showToast(response.message || 'Failed to save page', 'error');
            }
        } catch (error: unknown) {
            console.error('Failed to save page:', error);
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error saving page. Make sure Slug is unique.';
            showToast(errorMessage, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const response = await cmsService.deletePage(token, id, tenantId || undefined);
            if (response.success) {
                loadPages();
                showToast('Page deleted successfully');
            } else {
                showToast(response.message || 'Failed to delete page', 'error');
            }
        } catch (error) {
            console.error('Failed to delete page:', error);
            showToast('Failed to delete page', 'error');
        }
    };

    const handleEdit = (page: Page) => {
        setEditingPage(page);
        setShowForm(true);
    };

    return (
        <MainLayout activePage="cms">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">CMS Management</h1>
                        <p className="text-muted small">Create and manage content pages for your website.</p>
                    </div>
                    <button
                        className="btn btn-primary shadow-sm px-4 rounded-4"
                        onClick={() => {
                            setEditingPage(null);
                            setShowForm(true);
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        New Page
                    </button>
                </div>

                {showForm && (
                    <CMSForm
                        key={editingPage?.id || 'new'}
                        initialData={editingPage}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowForm(false)}
                        isSubmitting={false}
                        mediaItems={mediaItems}
                    />
                )}

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 py-5">
                            <Loader message="Fetching CMS content..." />
                        </div>
                    ) : pages.length === 0 ? (
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                <i className="bi bi-file-earmark-text display-1 text-muted opacity-25"></i>
                                <h4 className="mt-3 fw-bold text-muted">No Pages Found</h4>
                                <p className="text-muted">Create your first page to start building your content.</p>
                            </div>
                        </div>
                    ) : (
                        <CMSList
                            pages={pages}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .pulse {
                    animation: pulse-animation 2s infinite;
                }
                @keyframes pulse-animation {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
