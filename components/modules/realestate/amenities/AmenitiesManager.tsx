'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { amenityService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { Amenity } from '@/types';

interface AmenitiesManagerProps {
    mode: 'admin' | 'owner';
}

export default function AmenitiesManager({ mode }: AmenitiesManagerProps) {
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 1, // Default Facilities
        icon: 'bi-check-circle',
        status: 1
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated]);

    const token = typeof window !== 'undefined' ? getAuthToken() : '';

    // --- Queries ---

    const { data: amenitiesRes, isLoading: loading } = useQuery({
        queryKey: ['amenities'],
        queryFn: () => amenityService.getAmenities(token!),
        enabled: !!token && mounted && isAuthenticated,
    });

    const amenities = amenitiesRes?.data?.amenities || [];

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingAmenity) return amenityService.updateAmenity(token!, editingAmenity.id, payload);
            return amenityService.createAmenity(token!, payload);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['amenities'] });
                showToast(editingAmenity ? 'Amenity updated successfully' : 'Amenity created successfully');
                handleCloseModal();
            } else {
                showToast(res.message || 'Failed to save amenity', 'error');
            }
        },
        onError: () => showToast('Error saving amenity', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => amenityService.deleteAmenity(token!, id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['amenities'] });
                showToast('Amenity deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete amenity', 'error');
            }
        },
        onError: () => showToast('Error deleting amenity', 'error')
    });

    const handleEdit = (amenity: Amenity) => {
        if (mode === 'owner' && !amenity.tenantId) {
            showToast("You cannot edit global system amenities.", 'error');
            return;
        }

        setEditingAmenity(amenity);
        setFormData({
            name: amenity.name,
            category: amenity.category,
            icon: amenity.icon || 'bi-check-circle',
            status: amenity.status
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, tenantId: string | null) => {
        if (mode === 'owner' && !tenantId) {
            showToast("You cannot delete global system amenities.", 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this amenity?')) return;
        deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAmenity(null);
        setFormData({ name: '', category: 1, icon: 'bi-check-circle', status: 1 });
    };

    const isSubmitting = saveMutation.isPending;

    const getCategoryName = (cat: number) => {
        switch (cat) {
            case 1: return 'Facilities';
            case 2: return 'Technology';
            case 3: return 'Comfort';
            case 4: return 'Safety';
            case 5: return 'Other';
            default: return 'General';
        }
    };

    const filteredAmenities = amenities.filter((a: any) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted || !user) return null;

    return (
        <MainLayout activePage="amenities">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="fw-bold text-dark h3">Amenities Management</h1>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={() => { setEditingAmenity(null); setShowModal(true); }}
                    >
                        <i className="bi bi-plus-circle"></i>
                        Add Amenity
                    </button>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0"
                                        placeholder="Search amenities..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-5">
                        <Loader message="Loading amenities..." />
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredAmenities.map((amenity: any) => (
                            <div key={amenity.id} className="col-md-4 col-lg-3">
                                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="rounded-circle bg-light p-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                <i className={`bi ${amenity.icon || 'bi-check-circle'} fs-4 text-primary`}></i>
                                            </div>
                                            {(mode === 'admin' || amenity.tenantId) && (
                                                <div className="dropdown">
                                                    <button className="btn btn-link btn-sm text-muted p-0" data-bs-toggle="dropdown">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                                        <li>
                                                            <button className="dropdown-item" onClick={() => handleEdit(amenity)}>
                                                                <i className="bi bi-pencil me-2 small"></i>Edit
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item text-danger" onClick={() => handleDelete(amenity.id, amenity.tenantId || null)}>
                                                                <i className="bi bi-trash me-2 small"></i>Delete
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <h5 className="fw-bold mb-1">{amenity.name}</h5>
                                        <span className="badge bg-light text-muted border fw-normal mb-2">
                                            {getCategoryName(amenity.category)}
                                        </span>
                                        {!amenity.tenantId && (
                                            <span className="badge bg-info-subtle text-info border-info-subtle ms-2" style={{ fontSize: '10px' }}>Global</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4">
                                <h5 className="modal-title fw-bold">
                                    {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4 pt-0">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Amenity Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g. WiFi, Parking"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Category</label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>Facilities</option>
                                            <option value={2}>Technology</option>
                                            <option value={3}>Comfort</option>
                                            <option value={4}>Safety</option>
                                            <option value={5}>Other</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Icon (Bootstrap Icon Class)</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0">
                                                <i className={`bi ${formData.icon}`}></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.icon}
                                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                                placeholder="bi-check-circle"
                                            />
                                        </div>
                                        <div className="form-text small">
                                            Enter a Bootstrap Icon class name (e.g. bi-wifi, bi-car-front)
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Status</label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>Active</option>
                                            <option value={2}>Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : 'Save Amenity'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
