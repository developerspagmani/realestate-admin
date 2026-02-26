'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MediaItem } from '@/types';
import { mediaService, getAuthToken } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import ImageModal from '@/components/shared/ImageModal';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MediaManagerProps {
    mode: 'admin' | 'owner';
}

export default function MediaManager({ mode }: MediaManagerProps) {
    const queryClient = useQueryClient();
    const { user, isAuthenticated, isAdmin, isOwner } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterFolder, setFilterFolder] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('uploadedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        alt: '',
        caption: '',
        description: '',
        tags: '',
        folder: ''
    });

    // Upload states
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const token = typeof window !== 'undefined' ? getAuthToken() : '';

    // --- Queries ---

    const { data: mediaRes, isLoading: loading } = useQuery({
        queryKey: ['media', mode, activeTenantId, activeOwnerId, tenantType],
        queryFn: async () => {
            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const response = await mediaService.getMedia(token!, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });

            if (response.success) {
                return response.data.media.map((item: any) => ({
                    ...item,
                    title: item.filename || 'Untitled',
                    uploadedAt: item.createdAt,
                    folder: item.category || 'general',
                    tags: item.tags || []
                }));
            }
            return [];
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    const mediaItems = mediaRes || [];

    // --- Mutations ---

    const uploadMutation = useMutation({
        mutationFn: async ({ files, tenantId, ownerId }: { files: File[], tenantId?: string, ownerId?: string }) => {
            setUploadProgress(0);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const form = new FormData();
                form.append('file', file);
                form.append('alt', formData.alt);
                form.append('description', formData.description);
                form.append('category', formData.folder || 'general');

                if (tenantId) form.append('tenantId', tenantId);
                if (ownerId) form.append('ownerId', ownerId);

                await mediaService.createMedia(token!, form, tenantId);
                setUploadProgress(((i + 1) / files.length) * 100);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setShowUploadModal(false);
            setUploadFiles(null);
            setFormData({ title: '', alt: '', caption: '', description: '', tags: '', folder: '' });
            showToast('Upload successful');
        },
        onError: (err: any) => {
            console.error('Upload failed:', err);
            showToast('Upload failed', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mediaService.deleteMedia(token!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            showToast('Item deleted successfully');
        },
        onError: (err: any) => {
            console.error('Delete failed:', err);
            showToast('Failed to delete item', 'error');
        }
    });

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, mounted, router]);

    const uniqueFolders = Array.from(new Set(mediaItems.map((item: any) => item.folder))).sort();

    const filteredMedia = (mediaItems as any[])
        .filter((item: any) => {
            const matchesSearch = searchTerm === '' ||
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.filename.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || item.type === filterType;
            const matchesFolder = filterFolder === 'all' || item.folder === filterFolder;
            return matchesSearch && matchesType && matchesFolder;
        })
        .sort((a, b) => {
            let aValue: any = a[sortBy as keyof MediaItem] || '';
            let bValue: any = b[sortBy as keyof MediaItem] || '';
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadFiles(e.target.files);
    };

    const handleUploadSubmit = () => {
        if (!uploadFiles || !user) return;
        const tenantId = mode === 'admin' ? (activeTenantId || (user as any)?.tenantId) : (user as any)?.tenantId;
        const ownerId = mode === 'admin' ? (activeOwnerId || user?.id) : user?.id;
        uploadMutation.mutate({ files: Array.from(uploadFiles), tenantId, ownerId });
    };

    const handleViewImage = (url: string) => {
        setPreviewUrl(url);
        setShowPreview(true);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this item?')) return;
        deleteMutation.mutate(id);
    };

    const isUploading = uploadMutation.isPending;

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="media-library">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Media Library</h1>
                        <p className="text-muted small mb-0">Manage your assets, images and documents</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-bold" onClick={() => setShowUploadModal(true)}>
                        <i className="bi bi-cloud-arrow-up-fill"></i>
                        <span>Upload Files</span>
                    </button>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                    <div className="card-body p-4">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0 px-3"><i className="bi bi-search text-muted"></i></span>
                                    <input type="text" className="form-control bg-light border-0 ps-0" placeholder="Search media..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="all">All Types</option>
                                    <option value="image">Images</option>
                                    <option value="video">Videos</option>
                                    <option value="document">Documents</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterFolder} onChange={(e) => setFilterFolder(e.target.value)}>
                                    <option value="all">All Folders</option>
                                    {uniqueFolders.map((f: any) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4 d-flex justify-content-end gap-2">
                                <div className="btn-group shadow-none border rounded-3 p-1 bg-light">
                                    <button className={`btn btn-sm border-0 rounded-2 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-3x3-gap"></i></button>
                                    <button className={`btn btn-sm border-0 rounded-2 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('list')}><i className="bi bi-list"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-5">
                        <Loader message="Loading media library..." />
                    </div>
                ) : (
                    <div className="row g-4">
                        {viewMode === 'grid' ? (
                            filteredMedia.map(item => (
                                <div key={item.id} className="col-md-3 col-lg-2">
                                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden media-card">
                                        <div className="position-relative ratio ratio-1x1 bg-light d-flex align-items-center justify-content-center">
                                            {item.type === 'image' ? (
                                                <img src={item.url} className="w-100 h-100 object-fit-cover" alt={item.alt} />
                                            ) : (
                                                <i className={`bi ${item.type === 'video' ? 'bi-play-circle' : 'bi-file-earmark-text'} display-5 text-muted`}></i>
                                            )}
                                            <div className="media-overlay d-flex align-items-center justify-content-center gap-2">
                                                <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => handleViewImage(item.url)}><i className="bi bi-eye"></i></button>
                                                <button className="btn btn-sm btn-danger rounded-circle shadow-sm" onClick={() => handleDelete(item.id)}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <div className="fw-bold text-truncate small mb-0">{item.title}</div>
                                            <div className="text-muted extra-small">{formatFileSize(item.size)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 overflow-visible">
                                    <div className="vi-table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="px-4 py-3 small text-muted text-uppercase fw-bold">File</th>
                                                    <th className="py-3 small text-muted text-uppercase fw-bold">Type</th>
                                                    <th className="py-3 small text-muted text-uppercase fw-bold">Size</th>
                                                    <th className="py-3 small text-muted text-uppercase fw-bold">Date</th>
                                                    <th className="px-4 py-3 small text-muted text-uppercase fw-bold text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMedia.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="bg-light rounded p-1" style={{ width: '40px', height: '40px' }}>
                                                                    {item.type === 'image' ? <img src={item.url} className="w-100 h-100 object-fit-cover rounded" /> : <i className="bi bi-file-earmark-text text-muted h4 mb-0"></i>}
                                                                </div>
                                                                <div className="fw-bold text-dark small">{item.title}</div>
                                                            </div>
                                                        </td>
                                                        <td><span className="badge bg-light text-dark border fw-normal text-capitalize">{item.type}</span></td>
                                                        <td className="small text-muted">{formatFileSize(item.size)}</td>
                                                        <td className="small text-muted">{new Date(item.uploadedAt).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 text-end">
                                                            <button className="btn btn-sm btn-icon btn-light rounded-circle me-1" onClick={() => handleViewImage(item.url)}><i className="bi bi-eye"></i></button>
                                                            <button className="btn btn-sm btn-icon btn-light text-danger rounded-circle" onClick={() => handleDelete(item.id)}><i className="bi bi-trash"></i></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ImageModal
                show={showPreview}
                imageUrl={previewUrl}
                onClose={() => setShowPreview(false)}
            />

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">Upload New Media</h4>
                                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-4">
                                    <label className="form-label fw-bold small text-uppercase text-muted">Select Files</label>
                                    <div className="upload-zone p-5 text-center border-2 border-dashed rounded-4 bg-light cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <i className="bi bi-cloud-arrow-up display-4 text-primary mb-3 d-block"></i>
                                        <h6 className="fw-bold mb-1">Click to browse or drag and drop</h6>
                                        <p className="text-muted small">Supports JPG, PNG, MP4, PDF up to 20MB</p>
                                        <input type="file" ref={fileInputRef} className="d-none" multiple onChange={handleFileSelect} />
                                    </div>
                                </div>
                                {uploadFiles && (
                                    <div className="mb-4 p-3 bg-light rounded-3">
                                        <div className="fw-bold small mb-2">{uploadFiles.length} files selected</div>
                                        <div className="small text-muted text-truncate">{Array.from(uploadFiles).map(f => f.name).join(', ')}</div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-uppercase text-muted">Asset Category</label>
                                    <select className="form-select bg-light border-0" value={formData.folder} onChange={(e) => setFormData({ ...formData, folder: e.target.value })}>
                                        <option value="general">General</option>
                                        <option value="properties">Properties</option>
                                        <option value="units">Units</option>
                                        <option value="users">Users</option>
                                    </select>
                                </div>
                                {isUploading && (
                                    <div className="mb-3">
                                        <div className="progress rounded-4" style={{ height: '8px' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-light px-4 fw-bold" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={handleUploadSubmit} disabled={!uploadFiles || isUploading}>
                                    {isUploading ? 'Uploading...' : 'Start Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .media-card { transition: all 0.2s; }
        .media-card:hover { transform: translateY(-5px); }
        .media-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            opacity: 0;
            transition: opacity 0.2s;
        }
        .media-card:hover .media-overlay { opacity: 1; }
        .extra-small { font-size: 0.7rem; }
        .upload-zone { transition: all 0.2s; }
        .upload-zone:hover { background-color: #f1f3f5 !important; border-color: #0d6efd !important; }
        .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0; }
        .cursor-pointer { cursor: pointer; }
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
