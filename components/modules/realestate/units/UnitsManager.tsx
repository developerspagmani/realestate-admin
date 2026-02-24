'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { unitService, propertyService, mediaService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { Seats, Property, MediaItem } from '@/types';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import MediaSelector from '@/components/shared/MediaSelector';

interface UnitsManagerProps {
    mode: 'admin' | 'owner';
}

const EMPTY_FORM: Partial<Seats> = {
    name: '',
    slug: '',
    type: 'apartment',
    floorNo: 0,
    sizeSqft: 0,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: 1,
    parkingSlots: 0,
    facing: 1,
    monthlyRate: 0,
    price: 0,
    spaceId: '',
    features: [],
    status: 'available',
    mainImageId: '',
    gallery: [] as string[],
    displayPrice: true,
};

export default function UnitsManager({ mode }: UnitsManagerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId, currencySymbol, currencyCode } = useManagementContext();

    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');   // ← replaces showModal
    const [units, setUnits] = useState<Seats[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [editingWorkspace, setEditingWorkspace] = useState<Seats | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [formData, setFormData] = useState<Partial<Seats>>(EMPTY_FORM);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaModalType, setMediaModalType] = useState<'main' | 'gallery'>('main');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [filterProperty, setFilterProperty] = useState<string>(searchParams.get('propertyId') || 'all');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const urlPropertyId = searchParams.get('propertyId');

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) { router.push('/login'); return; }
        loadData();
    }, [user, isAuthenticated, mounted, router, urlPropertyId, activeTenantId, activeOwnerId, tenantType]);

    // ── DATA LOADING ──────────────────────────────────────────────────────────

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;

            const propsRes = await propertyService.getProperties(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
            });

            let loadedProperties: Property[] = [];
            if (propsRes.success && propsRes.data) {
                const rawProps = propsRes.data.properties || propsRes.data || [];
                loadedProperties = rawProps.map((p: any) => ({
                    id: p.id,
                    name: p.title || p.name,
                } as unknown as Property));
                setProperties(loadedProperties);
            }

            const unitsParams: any = {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
            };
            if (urlPropertyId) unitsParams.propertyId = urlPropertyId;

            const unitsRes = await unitService.getUnits(token, unitsParams);
            if (unitsRes.success && unitsRes.data?.units) {
                setUnits(unitsRes.data.units.map((u: any) => {
                    const prop = loadedProperties.find(p => p.id === u.propertyId);
                    const fixed = u.unitPricing?.find((p: any) => p.pricingModel === 1)?.price || 0;
                    const monthly = u.unitPricing?.find((p: any) => p.pricingModel === 4)?.price || 0;
                    const re = u.realEstateDetails || {};
                    return {
                        id: u.id,
                        name: u.unitCode || 'Unit ' + u.id.substring(0, 4),
                        slug: u.slug || u.id,
                        type: u.unitCategory === 1 ? 'apartment' : u.unitCategory === 2 ? 'house' : u.unitCategory === 3 ? 'office' : 'shop',
                        floorNo: u.floorNo || 0,
                        sizeSqft: u.sizeSqft || 0,
                        bedrooms: re.bedrooms,
                        bathrooms: re.bathrooms,
                        furnishing: re.furnishing,
                        parkingSlots: re.parkingSlots,
                        facing: re.facing,
                        price: parseFloat(fixed),
                        monthlyRate: parseFloat(monthly),
                        spaceId: u.propertyId,
                        space: prop as any,
                        features: u.unitAmenities?.map((a: any) => a.amenity?.name) || [],
                        status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : u.status === 3 ? 'maintenance' : u.status === 4 ? 'sold' : 'available',
                        createdAt: u.createdAt,
                        updatedAt: u.updatedAt,
                        mainImageId: u.mainImageId || '',
                        gallery: u.gallery || [],
                        displayPrice: re.displayPrice !== undefined ? re.displayPrice : true,
                    };
                }));
            }

            const mediaRes = await mediaService.getMedia(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
            });
            if (mediaRes.success) setMediaItems(mediaRes.data.media);

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── FILTERS ───────────────────────────────────────────────────────────────

    const filteredUnits = units.filter(unit => {
        const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || unit.type === filterType;
        const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
        const matchesProp = filterProperty === 'all' || unit.spaceId === filterProperty;
        return matchesSearch && matchesType && matchesStatus && matchesProp;
    });

    // ── VIEW TRANSITIONS ──────────────────────────────────────────────────────

    const openCreate = () => {
        setEditingWorkspace(null);
        setFormData({ ...EMPTY_FORM, gallery: [], features: [] });
        setValidationErrors([]);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openEdit = (unit: Seats) => {
        setEditingWorkspace(unit);
        setFormData({
            name: unit.name,
            slug: unit.slug || '',
            type: unit.type,
            floorNo: unit.floorNo || 0,
            sizeSqft: unit.sizeSqft || 0,
            bedrooms: unit.bedrooms || 1,
            bathrooms: unit.bathrooms || 1,
            furnishing: unit.furnishing || 1,
            parkingSlots: unit.parkingSlots || 0,
            facing: unit.facing || 1,
            monthlyRate: unit.monthlyRate,
            price: unit.price,
            spaceId: unit.spaceId,
            status: unit.status,
            mainImageId: unit.mainImageId || '',
            gallery: unit.gallery || [],
            displayPrice: unit.displayPrice !== undefined ? unit.displayPrice : true,
        });
        setValidationErrors([]);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const backToList = () => {
        setView('list');
        setEditingWorkspace(null);
        setValidationErrors([]);
    };

    // ── VALIDATION ────────────────────────────────────────────────────────────

    const validateForm = () => {
        const errors: string[] = [];
        if (!formData.name) errors.push('Unit Code');
        if (!formData.spaceId) errors.push('Target Property');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    // ── SUBMIT ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');

            const unitCategoryMap = { apartment: 1, house: 2, studio: 1, villa: 2, office: 3, shop: 4, warehouse: 3 };
            const statusMap = { available: 1, occupied: 2, maintenance: 3, sold: 4 };

            const payload = {
                tenantId,
                propertyId: formData.spaceId,
                unitCode: formData.name,
                slug: formData.slug || undefined,
                unitCategory: unitCategoryMap[formData.type as keyof typeof unitCategoryMap] || 1,
                floorNo: formData.floorNo,
                sizeSqft: formData.sizeSqft,
                status: statusMap[formData.status as keyof typeof statusMap] || 1,
                price: formData.price,
                monthlyRate: formData.monthlyRate,
                currency: currencyCode,
                mainImageId: formData.mainImageId,
                gallery: formData.gallery,
                realEstateDetails: {
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    furnishing: formData.furnishing,
                    parkingSlots: formData.parkingSlots,
                    facing: formData.facing,
                    displayPrice: formData.displayPrice,
                },
            };

            if (!tenantId) {
                showToast('Session expired or tenant not found', 'error');
                return;
            }

            if (editingWorkspace) {
                await unitService.updateUnit(token, editingWorkspace.id, payload, tenantId);
                showToast('Unit updated successfully!');
            } else {
                await unitService.createUnit(token, payload, tenantId);
                showToast('Unit added successfully!');
            }

            await loadData();
            backToList();
        } catch (error) {
            console.error('Failed to save unit:', error);
            showToast('Error saving unit.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (!window.confirm(`Delete ${ids.length > 1 ? ids.length + ' units' : 'this unit'}?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            await Promise.all(ids.map(unitId => unitService.deleteUnit(token, unitId, tenantId)));
            showToast(`${ids.length > 1 ? ids.length + ' units' : 'Unit'} deleted successfully`);
            setSelectedUnits(prev => prev.filter(uid => !ids.includes(uid)));
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Error deleting unit(s)', 'error');
        }
    };

    // ── DUPLICATE ─────────────────────────────────────────────────────────────

    const handleDuplicate = async (unit: Seats) => {
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            const unitCategoryMap = { apartment: 1, house: 2, studio: 1, villa: 2, office: 3, shop: 4, warehouse: 3 };
            const statusMap = { available: 1, occupied: 2, maintenance: 3, sold: 4 };
            await unitService.createUnit(token, {
                tenantId,
                propertyId: unit.spaceId,
                unitCode: `${unit.name} (Copy)`,
                slug: `${unit.slug}-copy-${Math.floor(Math.random() * 1000)}`,
                unitCategory: unitCategoryMap[unit.type as keyof typeof unitCategoryMap] || 1,
                floorNo: unit.floorNo,
                sizeSqft: unit.sizeSqft,
                status: statusMap[unit.status as keyof typeof statusMap] || 1,
                price: unit.price,
                monthlyRate: unit.monthlyRate,
                currency: currencyCode,
                mainImageId: unit.mainImageId,
                gallery: unit.gallery,
                realEstateDetails: {
                    bedrooms: unit.bedrooms, bathrooms: unit.bathrooms,
                    furnishing: unit.furnishing, parkingSlots: unit.parkingSlots, facing: unit.facing,
                },
            }, tenantId);
            showToast('Unit duplicated successfully!');
            loadData();
        } catch (error) {
            console.error('Duplicate error:', error);
            showToast('Error duplicating unit', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── STATUS CHANGE ─────────────────────────────────────────────────────────

    const handleStatusChange = async (id: string, newStatus: Seats['status']) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            const statusMap = { available: 1, occupied: 2, maintenance: 3, sold: 4 };
            const statusLabels = { available: 'Available', occupied: 'Reserved', maintenance: 'Maintenance', sold: 'Sold Out' };
            await unitService.updateUnit(token, id, { status: statusMap[newStatus] }, tenantId);
            showToast(`Unit marked as ${statusLabels[newStatus]}`);
            loadData();
        } catch (error) {
            console.error('Status update error:', error);
            showToast('Error updating status', 'error');
        }
    };

    // ── EXPORT ────────────────────────────────────────────────────────────────

    const handleExport = () => {
        const exportList = selectedUnits.length > 0
            ? filteredUnits.filter(u => selectedUnits.includes(u.id))
            : filteredUnits;
        if (exportList.length === 0) { showToast('No units to export', 'error'); return; }
        const headers = ['Unit Code', 'Property', 'Type', 'Price', 'Monthly Rent', 'Sqft', 'Floor', 'Bedrooms', 'Bathrooms', 'Status'];
        const rows = exportList.map(u => [
            `"${u.name}"`,
            `"${u.space?.name || ''}"`,
            u.type,
            u.price || 0,
            u.monthlyRate || 0,
            u.sizeSqft || 0,
            u.floorNo || 0,
            u.bedrooms || 0,
            u.bathrooms || 0,
            u.status
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `units_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(`${exportList.length} unit${exportList.length !== 1 ? 's' : ''} exported successfully`);
    };

    // ── CSV IMPORT ────────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = (event.target?.result as string).split('\n').filter(l => l.trim());
            if (lines.length < 2) { showToast('Invalid CSV file', 'error'); return; }
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
            setCsvHeaders(headers); setCsvRows(rows);
            const fields = ['unitCode', 'type', 'price', 'monthlyRate', 'sizeSqft', 'floorNo', 'bedrooms', 'bathrooms', 'furnishing', 'parkingSlots', 'facing'];
            const init: Record<string, string> = {};
            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase()));
                if (match) init[f] = match;
            });
            setMapping(init); setImportStep('mapping');
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        if (!formData.spaceId) { showToast('Please select a target property for import', 'error'); return; }
        setImportStep('progress'); setImportTotal(csvRows.length); setImportProgress(0);
        const token = getAuthToken();
        const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
        if (!token || !tenantId) return;
        const catMap = { apartment: 1, house: 2, studio: 1, villa: 2, office: 3, shop: 4, warehouse: 3 };
        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const get = (f: string) => { const h = mapping[f]; if (!h) return undefined; return row[csvHeaders.indexOf(h)]; };
            try {
                await unitService.createUnit(token, {
                    tenantId, propertyId: formData.spaceId,
                    unitCode: get('unitCode') || `Unit-${i + 1}`,
                    unitCategory: catMap[get('type') as keyof typeof catMap] || 1,
                    floorNo: parseInt(get('floorNo') || '0'), sizeSqft: parseInt(get('sizeSqft') || '0'),
                    status: 1, price: parseFloat(get('price') || '0'), monthlyRate: parseFloat(get('monthlyRate') || '0'),
                    currency: currencyCode,
                    realEstateDetails: {
                        bedrooms: parseInt(get('bedrooms') || '1'), bathrooms: parseInt(get('bathrooms') || '1'),
                        furnishing: parseInt(get('furnishing') || '1'), parkingSlots: parseInt(get('parkingSlots') || '0'),
                        facing: parseInt(get('facing') || '1'), displayPrice: true,
                    },
                }, tenantId);
            } catch (err) { console.error('Import failed for row', i, err); }
            setImportProgress(i + 1);
        }
        showToast(`Import completed: ${csvRows.length} units processed`);
        loadData(); setShowImportModal(false); setImportStep('file');
    };

    // ── SELECTION ─────────────────────────────────────────────────────────────

    const toggleSelectAll = () => {
        setSelectedUnits(selectedUnits.length === filteredUnits.length ? [] : filteredUnits.map(u => u.id));
    };
    const toggleSelect = (id: string) => {
        setSelectedUnits(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    // ── STATUS BADGE ──────────────────────────────────────────────────────────

    const getStatusBadge = (status: Seats['status']) => {
        const config = {
            available: { cls: 'bg-success-soft text-success', text: 'Available' },
            occupied: { cls: 'bg-warning-soft text-warning', text: 'Reserved' },
            maintenance: { cls: 'bg-secondary-soft text-secondary', text: 'Maintenance' },
            sold: { cls: 'bg-danger text-white', text: 'Sold Out' },
        };
        const c = config[status] || config.available;
        return <span className={`badge rounded-pill px-3 py-2 ${c.cls}`}>{c.text}</span>;
    };

    const getMediaUrl = (id?: string) => mediaItems.find(m => m.id === id)?.url;

    if (!mounted || !isAuthenticated) return null;

    // ══════════════════════════════════════════════════════════════════════════
    // ── FORM VIEW (full-page card groups) ─────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    if (view === 'form') {
        return (
            <MainLayout activePage="units">
                <div className="container-fluid py-4">

                    {/* Page Header Card */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <div className="card-body bg-primary bg-gradient p-4">
                            <div className="d-flex align-items-center gap-3">
                                <button type="button" className="btn btn-sm btn-light border-0 d-flex align-items-center gap-2 flex-shrink-0" onClick={backToList}>
                                    <i className="bi bi-arrow-left"></i>
                                    <span className="d-none d-sm-inline">Units</span>
                                </button>
                                <div>
                                    <h5 className="mb-0 fw-bold text-white">
                                        {editingWorkspace ? 'Edit Unit' : 'Add New Unit'}
                                    </h5>
                                    <p className="mb-0 small text-white opacity-75">
                                        {editingWorkspace ? `Editing: ${editingWorkspace.name}` : 'Fill in the details to register a new unit'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* Validation Banner */}
                        {validationErrors.length > 0 && (
                            <div className="alert alert-danger border-0 shadow-sm rounded-3 mb-4 d-flex align-items-start gap-3">
                                <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 flex-shrink-0"></i>
                                <div>
                                    <div className="fw-bold mb-1">Please fill in the required fields:</div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {validationErrors.map((err, i) => (
                                            <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">{err}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── CARD 1: Identity ────────────────────────────────── */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-transparent border-bottom px-4 py-3">
                                <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>1</span>
                                    Unit Identity
                                </h6>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">
                                            Unit Code <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. APT-101"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">URL Slug</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0"
                                            value={formData.slug || ''}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                            placeholder="e.g. apt-101"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">
                                            Property <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={formData.spaceId}
                                            onChange={e => setFormData({ ...formData, spaceId: e.target.value })}
                                            required
                                        >
                                            <option value="">Choose Property...</option>
                                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Unit Type</label>
                                        <select className="form-select bg-light border-0" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="studio">Studio</option>
                                            <option value="villa">Villa</option>
                                            <option value="office">Office</option>
                                            <option value="shop">Shop</option>
                                            <option value="warehouse">Warehouse</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Current Status</label>
                                        <select className="form-select bg-light border-0" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                            <option value="available">Available</option>
                                            <option value="occupied">Reserved</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="sold">Sold Out</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── CARD 2: Specifications ──────────────────────────── */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-transparent border-bottom px-4 py-3">
                                <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>2</span>
                                    Specifications
                                </h6>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Bedrooms</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })} min="0" />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Bathrooms</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })} min="0" />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Parking</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.parkingSlots} onChange={e => setFormData({ ...formData, parkingSlots: parseInt(e.target.value) })} min="0" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Size (Sqft)</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.sizeSqft} onChange={e => setFormData({ ...formData, sizeSqft: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Floor Number</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.floorNo} onChange={e => setFormData({ ...formData, floorNo: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Furnishing</label>
                                        <select className="form-select bg-light border-0" value={formData.furnishing} onChange={e => setFormData({ ...formData, furnishing: parseInt(e.target.value) })}>
                                            <option value={1}>Unfurnished</option>
                                            <option value={2}>Semi-Furnished</option>
                                            <option value={3}>Fully Furnished</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Facing</label>
                                        <select className="form-select bg-light border-0" value={formData.facing} onChange={e => setFormData({ ...formData, facing: parseInt(e.target.value) })}>
                                            <option value={1}>North</option>
                                            <option value={2}>South</option>
                                            <option value={3}>East</option>
                                            <option value={4}>West</option>
                                            <option value={5}>North-East</option>
                                            <option value={6}>North-West</option>
                                            <option value={7}>South-East</option>
                                            <option value={8}>South-West</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── CARD 3: Pricing ─────────────────────────────────── */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-transparent border-bottom px-4 py-3">
                                <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>3</span>
                                    Pricing
                                </h6>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Monthly Rent ({currencySymbol})</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.monthlyRate} onChange={e => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) })} placeholder="0.00" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Sale Price ({currencySymbol})</label>
                                        <input type="number" className="form-control bg-light border-0" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} placeholder="0.00" />
                                    </div>
                                    <div className="col-md-4 d-flex align-items-end">
                                        <div className="form-check form-switch p-0 m-0 d-flex align-items-center gap-2 pb-2">
                                            <input
                                                className="form-check-input ms-0 mt-0"
                                                type="checkbox"
                                                role="switch"
                                                id="unitDisplayPrice"
                                                checked={formData.displayPrice !== false}
                                                onChange={e => setFormData({ ...formData, displayPrice: e.target.checked })}
                                            />
                                            <label className="form-check-label small text-muted fw-semibold text-uppercase mb-0" htmlFor="unitDisplayPrice">
                                                Show price on listing page
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── CARD 4: Media ───────────────────────────────────── */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-transparent border-bottom px-4 py-3">
                                <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>4</span>
                                    Media
                                </h6>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4">
                                    {/* Main Image */}
                                    <div className="col-md-5">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">Main Image</label>
                                        <div
                                            className="border border-2 border-dashed rounded-4 p-4 text-center bg-light"
                                            style={{ cursor: 'pointer', minHeight: 140 }}
                                            onClick={() => { setMediaModalType('main'); setShowMediaModal(true); }}
                                        >
                                            {formData.mainImageId && getMediaUrl(formData.mainImageId) ? (
                                                <div>
                                                    <img src={getMediaUrl(formData.mainImageId)} style={{ maxHeight: 100, maxWidth: '100%' }} className="rounded-3 shadow-sm mb-2" alt="Main" />
                                                    <div className="small text-primary fw-semibold">Click to change</div>
                                                </div>
                                            ) : (
                                                <div className="py-2">
                                                    <i className="bi bi-image display-5 text-muted d-block mb-2"></i>
                                                    <span className="text-primary fw-semibold">Select Image</span>
                                                    <div className="small text-muted mt-1">Click to browse</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gallery */}
                                    <div className="col-md-7">
                                        <label className="form-label fw-semibold small text-uppercase text-muted">
                                            Gallery
                                            <span className="badge bg-light text-muted border ms-2 fw-normal">{(formData.gallery || []).length} images</span>
                                        </label>
                                        <div className="row g-2">
                                            {(formData.gallery || []).map((imgId: string, idx: number) => (
                                                <div key={idx} className="col-4 col-sm-3">
                                                    <div className="position-relative rounded-3 overflow-hidden bg-light" style={{ aspectRatio: '1/1' }}>
                                                        {getMediaUrl(imgId) && (
                                                            <img src={getMediaUrl(imgId)} className="w-100 h-100 object-fit-cover" alt={`Gallery ${idx + 1}`} />
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                            style={{ width: 22, height: 22 }}
                                                            onClick={() => setFormData({ ...formData, gallery: (formData.gallery || []).filter((id: string) => id !== imgId) })}
                                                        >
                                                            <i className="bi bi-x" style={{ fontSize: 10 }}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="col-4 col-sm-3">
                                                <div
                                                    className="border border-2 border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center bg-light"
                                                    style={{ aspectRatio: '1/1', cursor: 'pointer' }}
                                                    onClick={() => { setMediaModalType('gallery'); setShowMediaModal(true); }}
                                                >
                                                    <i className="bi bi-plus-lg text-primary fs-5"></i>
                                                    <span className="small text-primary mt-1">Add</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="d-flex justify-content-between align-items-center pt-2 pb-4">
                            <button type="button" className="btn btn-light px-4 fw-semibold d-flex align-items-center gap-2" onClick={backToList} disabled={isSubmitting}>
                                <i className="bi bi-arrow-left"></i> Back to List
                            </button>
                            <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm d-flex align-items-center gap-2" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><span className="spinner-border spinner-border-sm" role="status"></span>{editingWorkspace ? 'Saving...' : 'Creating...'}</>
                                ) : (
                                    <><i className={`bi ${editingWorkspace ? 'bi-check-lg' : 'bi-plus-circle'}`}></i>{editingWorkspace ? 'Save Changes' : 'Create Unit'}</>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Media Selector */}
                    <MediaSelector
                        show={showMediaModal}
                        onClose={() => setShowMediaModal(false)}
                        multiple={mediaModalType === 'gallery'}
                        onSelect={(selection) => {
                            if (mediaModalType === 'main') {
                                setFormData({ ...formData, mainImageId: (selection as MediaItem).id });
                            } else {
                                const newIds = (selection as MediaItem[]).map(m => m.id);
                                setFormData({ ...formData, gallery: Array.from(new Set([...(formData.gallery || []), ...newIds])) });
                            }
                            setShowMediaModal(false);
                        }}
                        selectedIds={mediaModalType === 'main' ? (formData.mainImageId ? [formData.mainImageId] : []) : (formData.gallery || [])}
                        title={mediaModalType === 'main' ? 'Select Unit Image' : 'Add to Gallery'}
                    />
                </div>

                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
            </MainLayout>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    // ── STATS ─────────────────────────────────────────────────────────────────
    const unitStats = {
        total: units.length,
        available: units.filter(u => u.status === 'available').length,
        occupied: units.filter(u => u.status === 'occupied').length,
        maintenance: units.filter(u => u.status === 'maintenance').length,
        sold: units.filter(u => u.status === 'sold').length,
    };

    return (
        <MainLayout activePage="units">
            <div className="container-fluid py-4">

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Units</h1>
                        <p className="text-muted small mb-0">{filteredUnits.length} unit{filteredUnits.length !== 1 ? 's' : ''} found
                            {selectedUnits.length > 0 && <span className="ms-2 badge bg-primary rounded-pill">{selectedUnits.length} selected</span>}
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={handleExport}>
                            <i className="bi bi-download"></i>
                            <span className="d-none d-md-inline">Export{selectedUnits.length > 0 ? ` (${selectedUnits.length})` : ''}</span>
                        </button>
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-upload"></i>
                            <span className="d-none d-md-inline">Import</span>
                        </button>
                        <button id="add-unit-btn" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={openCreate}>
                            <i className="bi bi-plus-circle-fill"></i>
                            <span>Add Unit</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 d-flex align-items-center gap-3">
                                <div className="rounded-3 bg-primary-soft d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                                    <i className="bi bi-building text-primary fs-5"></i>
                                </div>
                                <div>
                                    <div className="h4 fw-bold mb-0">{unitStats.total}</div>
                                    <div className="small text-muted">Total Units</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 d-flex align-items-center gap-3">
                                <div className="rounded-3 bg-success-soft d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                                    <i className="bi bi-check-circle text-success fs-5"></i>
                                </div>
                                <div>
                                    <div className="h4 fw-bold mb-0 text-success">{unitStats.available}</div>
                                    <div className="small text-muted">Available</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 d-flex align-items-center gap-3">
                                <div className="rounded-3 bg-warning-soft d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                                    <i className="bi bi-clock-history text-warning fs-5"></i>
                                </div>
                                <div>
                                    <div className="h4 fw-bold mb-0 text-warning">{unitStats.occupied}</div>
                                    <div className="small text-muted">Reserved</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-3 d-flex align-items-center gap-3">
                                <div className="rounded-3 bg-danger-soft d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                                    <i className="bi bi-tag text-danger fs-5"></i>
                                </div>
                                <div>
                                    <div className="h4 fw-bold mb-0 text-danger">{unitStats.sold}</div>
                                    <div className="small text-muted">Sold Out</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                                    <input type="text" className="form-control bg-light border-0" placeholder="Search by unit code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    {searchTerm && <button className="btn btn-light border-0" onClick={() => setSearchTerm('')}><i className="bi bi-x text-muted"></i></button>}
                                </div>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                    <option value="all">Type: All</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="studio">Studio</option>
                                    <option value="villa">Villa</option>
                                    <option value="office">Office</option>
                                    <option value="shop">Shop</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="all">Status: All</option>
                                    <option value="available">Available</option>
                                    <option value="occupied">Reserved</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="sold">Sold Out</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <div className="d-flex align-items-center gap-2">
                                    <select className="form-select bg-light border-0 flex-grow-1" value={filterProperty} onChange={e => setFilterProperty(e.target.value)}>
                                        <option value="all">Property: All</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    {selectedUnits.length > 0 && (
                                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(selectedUnits)} title="Delete Selected">
                                            <i className="bi bi-trash-fill"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 px-4" style={{ width: 40 }}>
                                            <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                                checked={selectedUnits.length === filteredUnits.length && filteredUnits.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Unit Details</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Property</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Type</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Pricing</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                        <th className="py-3 px-4 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUnits.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-5 text-muted">
                                            <i className="bi bi-inbox display-4 d-block mb-2 opacity-50"></i>
                                            No units found
                                        </td></tr>
                                    ) : filteredUnits.map(unit => (
                                        <tr key={unit.id} className={selectedUnits.includes(unit.id) ? 'table-active' : ''}>
                                            <td className="px-4 py-3">
                                                <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                                    checked={selectedUnits.includes(unit.id)} onChange={() => toggleSelect(unit.id)} />
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-bold text-dark">{unit.name}</div>
                                                <div className="small text-muted">{unit.bedrooms} BHK • {unit.sizeSqft} Sqft • Floor {unit.floorNo}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="small fw-medium">{unit.space?.name || '—'}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-capitalize small bg-light px-2 py-1 rounded text-muted">{unit.type}</span>
                                            </td>
                                            <td className="py-3">
                                                {unit.monthlyRate ? (
                                                    <div className="small fw-bold text-dark">{currencySymbol}{unit.monthlyRate.toLocaleString()}<span className="fw-normal text-muted">/mo</span></div>
                                                ) : (
                                                    <div className="small fw-bold text-dark">{currencySymbol}{(unit.price || 0).toLocaleString()}</div>
                                                )}
                                            </td>
                                            <td className="py-3">{getStatusBadge(unit.status)}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="dropdown">
                                                    <button className="btn btn-sm btn-light border-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} data-bs-toggle="dropdown">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                                                        <li><h6 className="dropdown-header small text-uppercase fw-bold text-muted">Actions</h6></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => openEdit(unit)}><i className="bi bi-pencil text-primary"></i>Edit Details</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleDuplicate(unit)}><i className="bi bi-files text-secondary"></i>Duplicate Unit</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><h6 className="dropdown-header small text-uppercase fw-bold text-muted">Set Status</h6></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(unit.id, 'available')} disabled={unit.status === 'available'}><i className="bi bi-check-circle text-success"></i>Available</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(unit.id, 'occupied')} disabled={unit.status === 'occupied'}><i className="bi bi-clock-history text-warning"></i>Reserved</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(unit.id, 'maintenance')} disabled={unit.status === 'maintenance'}><i className="bi bi-tools text-secondary"></i>Maintenance</button></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleStatusChange(unit.id, 'sold')} disabled={unit.status === 'sold'}><i className="bi bi-tag text-danger"></i>Sold Out</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={() => handleDelete(unit.id)}><i className="bi bi-trash"></i>Delete</button></li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Import Modal (kept as modal — lightweight step wizard) ── */}
            {showImportModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-2">
                                <h5 className="fw-bold mb-0">Import Units from CSV</h5>
                                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {importStep === 'file' && (
                                    <div className="text-center py-5 border border-2 border-dashed rounded-4 bg-light">
                                        <i className="bi bi-file-earmark-excel display-3 text-primary mb-3 d-block"></i>
                                        <h5>Choose a CSV File</h5>
                                        <p className="text-muted small mb-4">Select a .csv file containing unit details</p>
                                        <input type="file" accept=".csv" className="d-none" id="csv-upload" onChange={handleFileChange} />
                                        <label htmlFor="csv-upload" className="btn btn-primary px-4 fw-bold" style={{ cursor: 'pointer' }}>Select File</label>
                                    </div>
                                )}
                                {importStep === 'mapping' && (
                                    <div>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold small text-muted text-uppercase">1. Target Property</label>
                                            <select className="form-select bg-light border-0" value={formData.spaceId} onChange={e => setFormData({ ...formData, spaceId: e.target.value })}>
                                                <option value="">Choose Property for Imported Units...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <label className="form-label fw-bold small text-muted text-uppercase mb-3">2. Column Mapping</label>
                                        <div className="row g-2 overflow-auto" style={{ maxHeight: 320 }}>
                                            {['unitCode', 'type', 'price', 'monthlyRate', 'sizeSqft', 'floorNo', 'bedrooms', 'bathrooms', 'furnishing', 'parkingSlots', 'facing'].map(field => (
                                                <div key={field} className="col-md-6">
                                                    <div className="p-2 bg-light rounded border d-flex align-items-center">
                                                        <div className="flex-grow-1 small fw-bold text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</div>
                                                        <select className="form-select form-select-sm border-0 bg-white shadow-none" style={{ width: 150 }} value={mapping[field] || ''} onChange={e => setMapping({ ...mapping, [field]: e.target.value })}>
                                                            <option value="">Skip</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                                            <button className="btn btn-light px-4" onClick={() => setImportStep('file')}>Back</button>
                                            <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={executeImport}>Execute Import ({csvRows.length} units)</button>
                                        </div>
                                    </div>
                                )}
                                {importStep === 'progress' && (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                                        <h5>Importing Data...</h5>
                                        <p className="text-muted mb-4">Processing {importProgress} of {importTotal} records</p>
                                        <div className="progress rounded-4 bg-light" style={{ height: 12, maxWidth: 400, margin: '0 auto' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13,110,253,.1); }
                .bg-success-soft { background-color: rgba(25,135,84,.1); }
                .bg-warning-soft { background-color: rgba(255,193,7,.1); }
                .bg-danger-soft { background-color: rgba(220,53,69,.1); }
                .bg-secondary-soft { background-color: rgba(108,117,125,.1); }
                .cursor-pointer { cursor: pointer; }
                .dropdown-item:disabled, .dropdown-item[disabled] { opacity: 0.45; pointer-events: none; }
            `}</style>

            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        </MainLayout>
    );
}
