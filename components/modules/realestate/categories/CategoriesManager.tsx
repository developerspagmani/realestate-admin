'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { categoryService, propertyService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import React, { useState, useEffect, useCallback } from 'react';
import { Property, Category } from '@/types';

interface CategoriesManagerProps {
    mode: 'admin' | 'owner';
}

export default function CategoriesManager({ mode }: CategoriesManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const [modalTab, setModalTab] = useState<'details' | 'properties'>('details');
    const [assignedProperties, setAssignedProperties] = useState<Property[]>([]);
    const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
    const [propSearchTerm, setPropSearchTerm] = useState('');
    const [isLoadingProps, setIsLoadingProps] = useState(false);

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

    const loadCategories = useCallback(async (syncEditingId?: string) => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const response = await categoryService.getCategories(token);
            if (response.success) {
                const fetchedCategories: Category[] = response.data.categories || [];
                setCategories(fetchedCategories);

                // Keep editingCategory in sync with the list
                if (syncEditingId) {
                    const updated = fetchedCategories.find((c: Category) => c.id === syncEditingId);
                    if (updated) setEditingCategory(updated);
                }
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (mounted && isAuthenticated) {
            loadCategories();
        } else if (mounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [mounted, isAuthenticated, loadCategories, router]);
    const loadCategoryProperties = useCallback(async (categoryId: string) => {
        try {
            setIsLoadingProps(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (activeTenantId || user?.tenantId) as string;
            const res = await propertyService.getProperties(token, {
                tenantId: tenantId ?? undefined,
                categoryId: categoryId
            });
            if (res.success) {
                setAssignedProperties(res.data.properties || []);
            }
        } catch (error) {
            console.error('Failed to load category properties:', error);
        } finally {
            setIsLoadingProps(false);
        }
    }, [activeTenantId, user?.tenantId]);

    const searchAvailableProperties = useCallback(async (search: string) => {
        if (!search.trim()) {
            setAvailableProperties([]);
            return;
        }
        try {
            setIsLoadingProps(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (activeTenantId || user?.tenantId) as string;
            const res = await propertyService.getProperties(token, {
                tenantId: tenantId ?? undefined,
                search: search
            });
            if (res.success) {
                // Filter out properties already assigned to this category
                const props = (res.data.properties || []).filter(
                    (p: Property) => p.categoryId !== editingCategory?.id
                );
                setAvailableProperties(props);
            }
        } catch (error) {
            console.error('Failed to search properties:', error);
        } finally {
            setIsLoadingProps(false);
        }
    }, [activeTenantId, editingCategory?.id, user?.tenantId]);

    useEffect(() => {
        if (showModal && editingCategory && modalTab === 'properties') {
            loadCategoryProperties(editingCategory.id);
        }
    }, [showModal, editingCategory, modalTab, loadCategoryProperties]);

    const handleAssignProperty = async (propertyId: string) => {
        if (!editingCategory) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = activeTenantId || user?.tenantId;
            await propertyService.updateProperty(token, propertyId, { categoryId: editingCategory.id }, tenantId as string);
            showToast('Property assigned to category');
            loadCategoryProperties(editingCategory.id);
            if (propSearchTerm) searchAvailableProperties(propSearchTerm);
            loadCategories(editingCategory.id); // Refresh and sync editingCategory for accurate counts
        } catch (error) {
            console.error('Failed to assign property:', error);
            showToast('Failed to assign property', 'error');
        }
    };

    const handleUnassignProperty = async (propertyId: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = activeTenantId || user?.tenantId;
            await propertyService.updateProperty(token, propertyId, { categoryId: null }, tenantId as string);
            showToast('Property removed from category');
            if (editingCategory) {
                loadCategoryProperties(editingCategory.id);
                loadCategories(editingCategory.id); // Refresh and sync
            } else {
                loadCategories();
            }
        } catch (error) {
            console.error('Failed to unassign property:', error);
            showToast('Failed to unassign property', 'error');
        }
    };

    const handleEdit = (category: Category) => {
        // Can only edit own categories
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
        setModalTab('details');
        setShowModal(true);
    };

    const handleDelete = async (id: string, tenantId: string | null) => {
        if (mode === 'owner' && !tenantId) {
            showToast("You cannot delete global system categories.", 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = getAuthToken();
            if (!token) return;

            await categoryService.deleteCategory(token, id);
            setCategories(categories.filter(c => c.id !== id));
            showToast('Category deleted successfully');
        } catch (error: unknown) {
            console.error('Failed to delete category:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error deleting category.';
            showToast(errorMessage, 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;

            const submitData = {
                ...formData,
                parentId: formData.parentId || null
            };

            if (editingCategory) {
                await categoryService.updateCategory(token, editingCategory.id, submitData);
                showToast('Category updated successfully');
            } else {
                await categoryService.createCategory(token, submitData);
                showToast('Category created successfully');
            }

            await loadCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save category:', error);
            showToast('Error saving category.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', icon: 'bi-folder', parentId: '', sortOrder: 0, status: 1 });
        setModalTab('details');
        setAssignedProperties([]);
        setAvailableProperties([]);
        setPropSearchTerm('');
    };

    // Get parent categories (excluding the one being edited)
    const getAvailableParentCategories = () => {
        return categories.filter(c =>
            c.tenantId && // Only tenant categories can be parents
            (!editingCategory || c.id !== editingCategory.id)
        );
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group categories by parent
    const rootCategories = filteredCategories.filter(c => !c.parentId);
    const childCategories = filteredCategories.filter(c => c.parentId);

    if (!mounted || !user) return null;

    return (
        <MainLayout activePage="categories">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="fw-bold text-dark h3">Property Categories</h1>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={() => { setEditingCategory(null); setModalTab('details'); setShowModal(true); }}
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
                        {rootCategories.map(category => (
                            <div key={category.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                                                <i className={`bi ${category.icon || 'bi-folder'} fs-4 text-white`}></i>
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
                                        {childCategories.filter(c => c.parentId === category.id).length > 0 && (
                                            <div className="mt-3 pt-3 border-top">
                                                <small className="text-muted fw-semibold">Subcategories:</small>
                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                    {childCategories.filter(c => c.parentId === category.id).map(child => (
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
                        {childCategories.filter(c => !rootCategories.find(r => r.id === c.parentId)).map(category => (
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
                            <div className="modal-header border-0 p-4 pb-2">
                                <div className="w-100">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="modal-title fw-bold">
                                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                                        </h5>
                                        <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                                    </div>
                                    {editingCategory && (
                                        <ul className="nav nav-pills small fw-bold bg-light p-1 rounded-3 d-inline-flex">
                                            <li className="nav-item">
                                                <button
                                                    type="button"
                                                    className={`nav-link border-0 px-4 py-2 rounded-2 ${modalTab === 'details' ? 'bg-white shadow-sm text-white active' : 'text-muted'}`}
                                                    onClick={() => setModalTab('details')}
                                                >
                                                    <i className="bi bi-info-circle me-2"></i>Details
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button
                                                    type="button"
                                                    className={`nav-link border-0 px-4 py-2 rounded-2 ${modalTab === 'properties' ? 'bg-white shadow-sm text-white active' : 'text-muted'}`}
                                                    onClick={() => setModalTab('properties')}
                                                >
                                                    <i className="bi bi-building me-2"></i>Properties ({editingCategory._count?.properties || 0})
                                                </button>
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {modalTab === 'details' ? (
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
                                                            {getAvailableParentCategories().map(cat => (
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
                            ) : (
                                <div className="modal-body p-4 pt-0">
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted text-uppercase mb-3">Currently Assigned Properties</label>
                                        <div className="assigned-props-list rounded-4 border bg-light p-3" style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
                                            {isLoadingProps && assignedProperties.length === 0 ? (
                                                <div className="text-center py-4 text-muted small">Loading...</div>
                                            ) : assignedProperties.length === 0 ? (
                                                <div className="text-center py-4 text-muted small">
                                                    <i className="bi bi-building-dash d-block fs-2 mb-2 opacity-50"></i>
                                                    No properties assigned to this category.
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {assignedProperties.map(prop => (
                                                        <div key={prop.id} className="d-flex justify-content-between align-items-center bg-white p-2 px-3 rounded-3 shadow-sm border">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="rounded bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                    <i className="bi bi-building text-white"></i>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold small">{prop.title || prop.name}</div>
                                                                    <div className="extra-small text-muted">{prop.city}, {prop.state}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                                                title="Unassign"
                                                                onClick={() => handleUnassignProperty(prop.id)}
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted text-uppercase mb-3">Assign New Properties</label>
                                        <div className="input-group mb-3 shadow-sm">
                                            <span className="input-group-text bg-white border-end-0">
                                                <i className="bi bi-search text-muted"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-0"
                                                placeholder="Search properties by name..."
                                                value={propSearchTerm}
                                                onChange={(e) => {
                                                    setPropSearchTerm(e.target.value);
                                                    searchAvailableProperties(e.target.value);
                                                }}
                                            />
                                        </div>

                                        <div className="search-results rounded-4 border p-3" style={{ minHeight: '100px', maxHeight: '250px', overflowY: 'auto' }}>
                                            {!propSearchTerm ? (
                                                <div className="text-center py-4 text-muted small">Enter property name to search...</div>
                                            ) : isLoadingProps ? (
                                                <div className="text-center py-4 text-muted small">Searching...</div>
                                            ) : availableProperties.length === 0 ? (
                                                <div className="text-center py-4 text-muted small">No available properties found matching &quot;{propSearchTerm}&quot;</div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {availableProperties.map(prop => (
                                                        <div key={prop.id} className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3 border-bottom">
                                                            <div>
                                                                <div className="fw-bold small">{prop.title || prop.name}</div>
                                                                <div className="extra-small text-muted">
                                                                    {prop.city}, {prop.state}
                                                                    {prop.categoryId && <span className="ms-2 badge bg-light text-dark border">Currently: {categories.find(c => c.id === prop.categoryId)?.name || 'Assigned'}</span>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                                                onClick={() => handleAssignProperty(prop.id)}
                                                            >
                                                                Assign
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 pt-0">
                                        <button type="button" className="btn btn-primary px-4" onClick={handleCloseModal}>Done</button>
                                    </div>
                                </div>
                            )}
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
