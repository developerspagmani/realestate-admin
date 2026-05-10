import React, { useEffect, useState } from 'react';
import Loader from '@/components/common/Loader';

interface TrashItem {
    id: string;
    [key: string]: any; // Allow title, name, etc.
}

interface TrashBinProps {
    moduleName: string;
    show: boolean;
    onClose: () => void;
    fetchItems: () => Promise<TrashItem[]>;
    onRestore: (id: string) => Promise<boolean>;
    onPermanentDelete: (id: string) => Promise<boolean>;
    renderItemDetails: (item: TrashItem) => React.ReactNode;
}

export default function TrashBin({
    moduleName,
    show,
    onClose,
    fetchItems,
    onRestore,
    onPermanentDelete,
    renderItemDetails
}: TrashBinProps) {
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            loadItems();
        }
    }, [show]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const fetched = await fetchItems();
            setItems(fetched || []);
        } catch (error) {
            console.error('Error fetching trash items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        setActionLoadingId(id);
        const success = await onRestore(id);
        if (success) {
            setItems(items.filter(item => item.id !== id));
        }
        setActionLoadingId(null);
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm('Are you certain you want to permanently delete this item? This action cannot be reversed.')) return;
        
        setActionLoadingId(id);
        const success = await onPermanentDelete(id);
        if (success) {
            setItems(items.filter(item => item.id !== id));
        }
        setActionLoadingId(null);
    };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose}></div>
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden h-100">
                        <div className="modal-header bg-light border-0 px-4 py-3 d-flex align-items-center">
                            <div className="d-flex align-items-center text-danger">
                                <i className="bi bi-trash3-fill fs-4 me-3"></i>
                                <div>
                                    <h5 className="modal-title fw-bold text-dark mb-0">{moduleName} Trash Bin</h5>
                                    <small className="text-muted">Items here can be restored or permanently removed.</small>
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body p-0 bg-light" style={{ minHeight: '300px' }}>
                            {loading ? (
                                <div className="p-5 text-center">
                                    <Loader size="md" message="Loading archive..." />
                                </div>
                            ) : items.length === 0 ? (
                                <div className="p-5 text-center text-muted">
                                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                    <h5>Trash is empty</h5>
                                    <p className="small mb-0">No deleted {moduleName.toLowerCase()} found.</p>
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {items.map(item => (
                                        <div key={item.id} className="list-group-item bg-white border-bottom p-4">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="flex-grow-1">
                                                    {renderItemDetails(item)}
                                                </div>
                                                <div className="d-flex gap-2 ms-4">
                                                    {actionLoadingId === item.id ? (
                                                        <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                                onClick={() => handleRestore(item.id)}
                                                                title="Restore"
                                                            >
                                                                <i className="bi bi-arrow-counterclockwise me-1"></i> Restore
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-danger rounded-pill px-3 shadow-sm"
                                                                onClick={() => handlePermanentDelete(item.id)}
                                                                title="Delete Permanently"
                                                            >
                                                                <i className="bi bi-trash-fill"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-0 p-3 bg-white">
                           <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
