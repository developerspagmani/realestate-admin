'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { categoryService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useManagementContext } from '@/app/contexts/ManagementContext';

interface Category {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    sortOrder: number;
    status: number;
    tenantId?: string | null;
    parent?: { id: string; name: string } | null;
    _count?: { properties: number; children: number };
}

interface CategoriesManagerProps {
    mode: 'admin' | 'owner';
}

export default function CategoriesManager({ mode }: CategoriesManagerProps) {
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
        description: '',
        icon: 'bi-folder',
        parentId: '',
        sortOrder: 0,
        status: 1
    });

    // Popular icons for property categories
    const popularIcons = [
        'bi-house', 'bi-building', 'bi-buildings', 'bi-house-door',
        'bi-house-fill', 'bi-shop', 'bi-hospital', 'bi-bank',
        'bi-tree', 'bi-water', 'bi-sun', 'bi-geo-alt',
        'bi-pin-map', 'bi-map', 'bi-globe', 'bi-flag',
        'bi-star', 'bi-heart', 'bi-gem', 'bi-award',
        'bi-briefcase', 'bi-cash', 'bi-wallet', 'bi-currency-dollar',
        'bi-folder', 'bi-folder2', 'bi-collection', 'bi-grid',
        'bi-layers', 'bi-stack', 'bi-diagram-3', 'bi-bezier2'
    ];

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

    const { data: categoriesRes, isLoading: loading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(token!),
        enabled: !!token && mounted && isAuthenticated,
    });

    const categories = categoriesRes?.data?.categories || [];

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            const submitData = {
                ...payload,
                parentId: payload.parentId || null
            };
            if (editingCategory) return categoryService.updateCategory(token!, editingCategory.id, submitData);
            return categoryService.createCategory(token!, submitData);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                showToast(editingCategory ? 'Category updated successfully' : 'Category created successfully');
                handleCloseModal();
            } else {
                showToast(res.message || 'Failed to save category', 'error');
            }
        },
        onError: () => showToast('Error saving category', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(token!, id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                showToast('Category deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete category', 'error');
            }
        },
        onError: (err: any) => showToast(err.message || 'Error deleting category', 'error')
    });

    const handleEdit = (category: Category) => {
        if (mode === 'owner' && !category.tenantId) {
            showToast("You cannot edit global system categories.", 'error');
            return;
        }

        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            icon: category.icon || 'bi-folder',
            parentId: category.parentId || '',
            sortOrder: category.sortOrder || 0,
            status: category.status
        });
        setShowModal(true);
    };

    const handleDelete = (id: string, tenantId: string | null) => {
        if (mode === 'owner' && !tenantId) {
            showToast("You cannot delete global system categories.", 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this category?')) return;
        deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', icon: 'bi-folder', parentId: '', sortOrder: 0, status: 1 });
    };

    const isSubmitting = saveMutation.isPending;

    // Get parent categories (excluding the one being edited)
    const getAvailableParentCategories = () => {
        return categories.filter((c: any) =>
            c.tenantId && // Only tenant categories can be parents
            (!editingCategory || c.id !== editingCategory.id)
        );
    };

    const filteredCategories = categories.filter((c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group categories by parent
    const rootCategories = filteredCategories.filter((c: any) => !c.parentId);
    const childCategories = filteredCategories.filter((c: any) => c.parentId);

    if (!mounted || !user) return null;

    return (
        <MainLayout activePage="categories">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="fw-bold text-dark h3">Property Categories</h1>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={() => { setEditingCategory(null); setShowModal(true); }}
                    >
                        <i className="bi bi-plus-circle"></i>
                        Add Category
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
                                        placeholder="Search categories..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 text-end">
                                <span className="text-muted small">
                                    {categories.length} categories total
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-5">
                        <Loader message="Loading categories..." />
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-folder2-open display-1 text-muted mb-3"></i>
                        <h5 className="text-muted">No categories found</h5>
                        <p className="text-muted">Create your first property category to organize your listings.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {rootCategories.map((category: any) => (
                            <div key={category.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                                <i className={`bi ${category.icon || 'bi-folder'} fs-4 text-primary`}></i>
                                            </div>
                                            {(mode === 'admin' || category.tenantId) && (
                                                <div className="dropdown">
                                                    <button className="btn btn-link btn-sm text-muted p-0" data-bs-toggle="dropdown">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                                        <li>
                                                            <button className="dropdown-item" onClick={() => handleEdit(category)}>
                                                                <i className="bi bi-pencil me-2 small"></i>Edit
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item text-danger" onClick={() => handleDelete(category.id, category.tenantId || null)}>
                                                                <i className="bi bi-trash me-2 small"></i>Delete
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <h5 className="fw-bold mb-1">{category.name}</h5>
                                        {category.description && (
                                            <p className="text-muted small mb-2">{category.description}</p>
                                        )}
                                        <div className="d-flex gap-2 flex-wrap">
                                            <span className="badge bg-light text-dark border">
                                                <i className="bi bi-building me-1"></i>
                                                {category._count?.properties || 0} properties
                                            </span>
                                            {category._count?.children ? (
                                                <span className="badge bg-light text-dark border">
                                                    <i className="bi bi-diagram-3 me-1"></i>
                                                    {category._count.children} subcategories
                                                </span>
                                            ) : null}
                                            {!category.tenantId && (
                                                <span className="badge bg-info-subtle text-info border-info-subtle" style={{ fontSize: '10px' }}>Global</span>
                                            )}
                                        </div>

                                        {/* Show child categories */}
                                        {childCategories.filter((c: any) => c.parentId === category.id).length > 0 && (
                                            <div className="mt-3 pt-3 border-top">
                                                <small className="text-muted fw-semibold">Subcategories:</small>
                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                    {childCategories.filter((c: any) => c.parentId === category.id).map((child: any) => (
                                                        <span key={child.id} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                                            <i className={`bi ${child.icon || 'bi-folder'} small`}></i>
                                                            {child.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Orphaned child categories (parent not visible in search) */}
                        {childCategories.filter((c: any) => !rootCategories.find((r: any) => r.id === c.parentId)).map((category: any) => (
                            <div key={category.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all border-start border-primary border-3">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="rounded-circle bg-secondary bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                <i className={`bi ${category.icon || 'bi-folder'} fs-5 text-secondary`}></i>
                                            </div>
                                            {(mode === 'admin' || category.tenantId) && (
                                                <div className="dropdown">
                                                    <button className="btn btn-link btn-sm text-muted p-0" data-bs-toggle="dropdown">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                                        <li>
                                                            <button className="dropdown-item" onClick={() => handleEdit(category)}>
                                                                <i className="bi bi-pencil me-2 small"></i>Edit
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item text-danger" onClick={() => handleDelete(category.id, category.tenantId || null)}>
                                                                <i className="bi bi-trash me-2 small"></i>Delete
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div className="small text-muted mb-1">
                                            <i className="bi bi-arrow-return-right me-1"></i>
                                            {category.parent?.name || 'Subcategory'}
                                        </div>
                                        <h5 className="fw-bold mb-1">{category.name}</h5>
                                        <span className="badge bg-light text-dark border">
                                            <i className="bi bi-building me-1"></i>
                                            {category._count?.properties || 0} properties
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4">
                                <h5 className="modal-title fw-bold">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4 pt-0">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-muted">Category Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                    placeholder="e.g. Luxury Villas"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-muted">Description</label>
                                                <textarea
                                                    className="form-control bg-light border-0"
                                                    rows={3}
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Brief description of this category..."
                                                />
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label small fw-bold text-muted">Parent Category</label>
                                                    <select
                                                        className="form-select bg-light border-0"
                                                        value={formData.parentId}
                                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                                    >
                                                        <option value="">None (Top Level)</option>
                                                        {getAvailableParentCategories().map((cat: any) => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <label className="form-label small fw-bold text-muted">Sort Order</label>
                                                    <input
                                                        type="number"
                                                        className="form-control bg-light border-0"
                                                        value={formData.sortOrder}
                                                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                                        min={0}
                                                    />
                                                </div>
                                                <div className="col-md-3 mb-3">
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
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-muted">Select Icon</label>
                                            <div className="bg-light rounded-3 p-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {popularIcons.map(icon => (
                                                        <button
                                                            key={icon}
                                                            type="button"
                                                            className={`btn btn-sm ${formData.icon === icon ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => setFormData({ ...formData, icon })}
                                                        >
                                                            <i className={`bi ${icon}`}></i>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <label className="form-label small fw-bold text-muted">Or enter custom icon</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-0">
                                                        <i className={`bi ${formData.icon}`}></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light border-0"
                                                        value={formData.icon}
                                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                                        placeholder="bi-folder"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : 'Save Category'}
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
