'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { cmsService } from '@/app/services/cms';
import { mediaService } from '@/app/services/media';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import CMSForm from '@/components/modules/realestate/cms/CMSForm';
import CMSList from '@/components/modules/realestate/cms/CMSList';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CMSManagerProps {
    mode?: 'admin' | 'owner';
}

const INITIAL_FORM_DATA = {
    title: '',
    slug: '',
    content: '',
    featureImageId: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    status: 1
};

export default function CMSManager({ mode = 'owner' }: CMSManagerProps) {
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const [showForm, setShowForm] = useState(false);
    const [editingPage, setEditingPage] = useState<any>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
    const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;

    const { data: pagesRes, isLoading: loading } = useQuery({
        queryKey: ['cms-pages', tenantId],
        queryFn: () => cmsService.getPages(token, tenantId),
        enabled: isAuthenticated && !!tenantId,
    });

    const { data: mediaRes } = useQuery({
        queryKey: ['media-list', tenantId],
        queryFn: () => mediaService.getMedia(token, { tenantId }),
        enabled: isAuthenticated && !!tenantId,
    });

    const pages = pagesRes?.data || [];
    const mediaItems = useMemo(() => {
        if (!mediaRes?.success) return [];
        return Array.isArray(mediaRes.data) ? mediaRes.data : (mediaRes.data?.media || []);
    }, [mediaRes]);

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            const finalData = { ...data, tenantId };
            if (editingPage) return cmsService.updatePage(token, editingPage.id, finalData, tenantId);
            return cmsService.createPage(token, finalData);
        },
        onSuccess: (res) => {
            if (res.success) {
                setShowForm(false);
                setEditingPage(null);
                setFormData(INITIAL_FORM_DATA);
                queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
                showToast(editingPage ? 'Page updated successfully' : 'Page created successfully');
            } else {
                showToast(res.message || 'Failed to save page', 'error');
            }
        },
        onError: (error: any) => {
            console.error('Failed to save page:', error);
            showToast(error.response?.data?.message || 'Error saving page. Make sure Slug is unique.', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => cmsService.deletePage(token, id, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
                showToast('Page deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete page', 'error');
            }
        },
        onError: (error) => {
            console.error('Failed to delete page:', error);
            showToast('Failed to delete page', 'error');
        }
    });

    const handleSubmit = async (data: any) => {
        saveMutation.mutate(data);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        deleteMutation.mutate(id);
    };

    const handleEdit = (page: any) => {
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
                        initialData={editingPage}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowForm(false)}
                        isSubmitting={saveMutation.isPending}
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
