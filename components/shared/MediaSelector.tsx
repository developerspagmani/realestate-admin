'use client';

import { useState, useEffect, useRef } from 'react';
import { mediaService, getAuthToken } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { MediaItem } from '@/types';

interface MediaSelectorProps {
    show: boolean;
    onClose: () => void;
    onSelect: (media: MediaItem | MediaItem[]) => void;
    multiple?: boolean;
    selectedIds?: string[];
    title?: string;
}

export default function MediaSelector({
    show,
    onClose,
    onSelect,
    multiple = false,
    selectedIds = [],
    title = 'Select Media'
}: MediaSelectorProps) {
    const { user } = useAuthContext();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('image'); // Default to images
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (show) {
            loadMediaItems();
            setLocalSelectedIds(selectedIds);
        }
    }, [show, selectedIds]);

    const loadMediaItems = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || undefined;
            const response = await mediaService.getMedia(token, tenantId ? { tenantId } : undefined);
            if (response.success) {
                const mappedMedia = response.data.media.map((item: any) => ({
                    ...item,
                    title: item.filename || 'Untitled',
                    uploadedAt: item.createdAt,
                    folder: item.category || 'general',
                    tags: item.tags || []
                }));
                setMediaItems(mappedMedia);
            }
        } catch (error) {
            console.error('Failed to load media items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || undefined;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const form = new FormData();
                form.append('file', file);
                form.append('category', 'general');
                await mediaService.createMedia(token, form, tenantId);
            }
            await loadMediaItems();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload media.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredMedia = mediaItems.filter(item => {
        const matchesSearch = searchTerm === '' ||
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleToggleSelect = (item: MediaItem) => {
        if (multiple) {
            setLocalSelectedIds(prev =>
                prev.includes(item.id)
                    ? prev.filter(id => id !== item.id)
                    : [...prev, item.id]
            );
        } else {
            setLocalSelectedIds([item.id]);
        }
    };

    const handleConfirm = () => {
        const selectedMedia = mediaItems.filter(item => localSelectedIds.includes(item.id));
        if (multiple) {
            onSelect(selectedMedia);
        } else {
            onSelect(selectedMedia[0] || null);
        }
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-0 p-4 pb-0">
                        <h4 className="fw-bold">{title}</h4>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="input-group bg-light rounded-3">
                                    <span className="input-group-text bg-transparent border-0"><i className="bi bi-search text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control bg-transparent border-0"
                                        placeholder="Search media..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-select bg-light border-0"
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="image">Images</option>
                                    <option value="video">Videos</option>
                                    <option value="document">Documents</option>
                                </select>
                            </div>
                            <div className="col-md-3 text-end">
                                <button
                                    className="btn btn-primary w-100 shadow-sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    ) : (
                                        <i className="bi bi-upload me-2"></i>
                                    )}
                                    Upload New
                                </button>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    multiple
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : filteredMedia.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                No media files found.
                            </div>
                        ) : (
                            <div className="row g-3">
                                {filteredMedia.map(item => (
                                    <div key={item.id} className="col-6 col-md-3 col-lg-2">
                                        <div
                                            className={`card h-100 cursor-pointer border-2 transition-all ${localSelectedIds.includes(item.id) ? 'border-primary shadow-sm' : 'border-transparent'
                                                }`}
                                            onClick={() => handleToggleSelect(item)}
                                        >
                                            <div className="position-relative aspect-ratio-square overflow-hidden rounded-2 bg-light">
                                                {item.type === 'image' ? (
                                                    <img
                                                        src={item.url}
                                                        alt={item.alt}
                                                        className="w-100 h-100 object-fit-cover"
                                                    />
                                                ) : (
                                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                                        <i className="bi bi-file-earmark-text display-6 text-muted"></i>
                                                    </div>
                                                )}
                                                {localSelectedIds.includes(item.id) && (
                                                    <div className="position-absolute top-0 end-0 m-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                                        <i className="bi bi-check small"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2">
                                                <div className="small text-truncate fw-bold">{item.title}</div>
                                               
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-0 p-4 pt-0">
                        <div className="me-auto text-muted small">
                            {localSelectedIds.length} item(s) selected
                        </div>
                        <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                        <button
                            type="button"
                            className="btn btn-primary px-4 shadow-sm"
                            onClick={handleConfirm}
                            disabled={localSelectedIds.length === 0}
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
        .aspect-ratio-square {
          aspect-ratio: 1 / 1;
        }
        .extra-small {
          font-size: 10px;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .border-transparent {
          border-color: transparent;
        }
      `}</style>
        </div>
    );
}
