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

export default function UnitsManager({ mode }: UnitsManagerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [units, setUnits] = useState<Seats[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<Seats | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [formData, setFormData] = useState<Partial<Seats>>({
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
        gallery: [] as string[]
    });
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaModalType, setMediaModalType] = useState<'main' | 'gallery'>('main');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [filterProperty, setFilterProperty] = useState<string>(searchParams.get('propertyId') || 'all');

    // Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };
    const urlPropertyId = searchParams.get('propertyId');

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            // Only send industryType if we haven't selected a specific owner/tenant (Global View)
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;

            const propsRes = await propertyService.getProperties(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
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
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            };
            if (urlPropertyId) unitsParams.propertyId = urlPropertyId;

            const unitsRes = await unitService.getUnits(token, unitsParams);
            if (unitsRes.success && unitsRes.data && unitsRes.data.units) {
                const mappedUnits: Seats[] = unitsRes.data.units.map((u: any) => {
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
                        status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : u.status === 3 ? 'maintenance' : 'sold',
                        createdAt: u.createdAt,
                        updatedAt: u.updatedAt,
                        mainImageId: u.mainImageId || '',
                        gallery: u.gallery || []
                    };
                });
                setUnits(mappedUnits);
            }

            const mediaRes = await mediaService.getMedia(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (mediaRes.success) {
                setMediaItems(mediaRes.data.media);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadData();
    }, [user, isAuthenticated, mounted, router, urlPropertyId, activeTenantId, activeOwnerId, tenantType]);

    const filteredUnits = units.filter(unit => {
        const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || unit.type === filterType;
        const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
        const matchesProperty = filterProperty === 'all' || unit.spaceId === filterProperty;
        return matchesSearch && matchesType && matchesStatus && matchesProperty;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');

            const unitCategoryMap = { 'apartment': 1, 'house': 2, 'studio': 1, 'villa': 2, 'office': 2, 'shop': 2, 'warehouse': 3 };
            const statusMap = { 'available': 1, 'occupied': 2, 'maintenance': 3, 'sold': 2 };

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
                currency: 'USD',
                mainImageId: formData.mainImageId,
                gallery: formData.gallery,
                realEstateDetails: {
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    furnishing: formData.furnishing,
                    parkingSlots: formData.parkingSlots,
                    facing: formData.facing
                }
            };

            if (!token || !tenantId) {
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

            loadData();
            setTimeout(() => { resetForm(); }, 1500);

        } catch (error) {
            console.error('Failed to save unit:', error);
            showToast('Error saving unit.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (unit: Seats) => {
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
            gallery: unit.gallery || []
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (!window.confirm(`Delete ${ids.length > 1 ? ids.length + ' units' : 'this unit'}?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';

            if (Array.isArray(id)) {
                await Promise.all(ids.map(unitId => unitService.deleteUnit(token, unitId, tenantId)));
                showToast(`${ids.length} units deleted successfully`);
                setSelectedUnits([]);
            } else {
                await unitService.deleteUnit(token, id, tenantId);
                showToast('Unit deleted successfully');
                setSelectedUnits(selectedUnits.filter(uId => uId !== id));
            }
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Error deleting unit(s)', 'error');
        }
    };

    const handleDuplicate = async (unit: Seats) => {
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';

            const unitCategoryMap = { 'apartment': 1, 'house': 2, 'studio': 1, 'villa': 2, 'office': 2, 'shop': 2, 'warehouse': 3 };
            const statusMap = { 'available': 1, 'occupied': 2, 'maintenance': 3, 'sold': 2 };

            const payload = {
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
                currency: 'USD',
                mainImageId: unit.mainImageId,
                gallery: unit.gallery,
                realEstateDetails: {
                    bedrooms: unit.bedrooms,
                    bathrooms: unit.bathrooms,
                    furnishing: unit.furnishing,
                    parkingSlots: unit.parkingSlots,
                    facing: unit.facing
                }
            };

            await unitService.createUnit(token, payload, tenantId);
            showToast('Unit duplicated successfully!');
            loadData();
        } catch (error) {
            console.error('Duplicate error:', error);
            showToast('Error duplicating unit', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUnits.length === filteredUnits.length) {
            setSelectedUnits([]);
        } else {
            setSelectedUnits(filteredUnits.map(u => u.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedUnits.includes(id)) {
            setSelectedUnits(selectedUnits.filter(uId => uId !== id));
        } else {
            setSelectedUnits([...selectedUnits, id]);
        }
    };

    const handleExport = () => {
        if (units.length === 0) {
            showToast('No units to export', 'error');
            return;
        }

        const headers = ['Unit Code', 'Property', 'Type', 'Price', 'Monthly Rent', 'Sqft', 'Floor', 'Bedrooms', 'Bathrooms', 'Furnishing', 'Parking', 'Facing', 'Status'];
        const rows = units.map(u => [
            u.name,
            u.space?.name || '',
            u.type,
            u.price || 0,
            u.monthlyRate || 0,
            u.sizeSqft || 0,
            u.floorNo || 0,
            u.bedrooms || 0,
            u.bathrooms || 0,
            u.furnishing || 1,
            u.parkingSlots || 0,
            u.facing || 1,
            u.status
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `units_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Units exported successfully');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').filter(l => l.trim() !== '');
            if (lines.length < 2) {
                showToast('Invalid CSV file', 'error');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));

            setCsvHeaders(headers);
            setCsvRows(rows);

            // Initial auto-mapping based on common names
            const initialMapping: Record<string, string> = {};
            const fields = ['unitCode', 'type', 'price', 'monthlyRate', 'sizeSqft', 'floorNo', 'bedrooms', 'bathrooms', 'furnishing', 'parkingSlots', 'facing'];

            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase()));
                if (match) initialMapping[f] = match;
            });

            setMapping(initialMapping);
            setImportStep('mapping');
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        if (!formData.spaceId) {
            showToast('Please select a target property for import', 'error');
            return;
        }

        setImportStep('progress');
        setImportTotal(csvRows.length);
        setImportProgress(0);

        const token = getAuthToken();
        const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
        if (!token || !tenantId) return;

        const unitCategoryMap = { 'apartment': 1, 'house': 2, 'studio': 1, 'villa': 2, 'office': 2, 'shop': 2, 'warehouse': 3 };

        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const getVal = (field: string) => {
                const header = mapping[field];
                if (!header) return undefined;
                const idx = csvHeaders.indexOf(header);
                return row[idx];
            };

            const payload = {
                tenantId,
                propertyId: formData.spaceId,
                unitCode: getVal('unitCode') || `Unit-${i + 1}`,
                unitCategory: unitCategoryMap[getVal('type') as keyof typeof unitCategoryMap] || 1,
                floorNo: parseInt(getVal('floorNo') || '0'),
                sizeSqft: parseInt(getVal('sizeSqft') || '0'),
                status: 1,
                price: parseFloat(getVal('price') || '0'),
                monthlyRate: parseFloat(getVal('monthlyRate') || '0'),
                currency: 'USD',
                realEstateDetails: {
                    bedrooms: parseInt(getVal('bedrooms') || '1'),
                    bathrooms: parseInt(getVal('bathrooms') || '1'),
                    furnishing: parseInt(getVal('furnishing') || '1'),
                    parkingSlots: parseInt(getVal('parkingSlots') || '0'),
                    facing: parseInt(getVal('facing') || '1')
                }
            };

            try {
                await unitService.createUnit(token, payload, tenantId);
            } catch (err) {
                console.error('Import failed for row', i, err);
            }
            setImportProgress(i + 1);
        }

        showToast(`Import completed: ${csvRows.length} units processed`);
        loadData();
        setShowImportModal(false);
        setImportStep('file');
    };

    const handleStatusChange = async (id: string, newStatus: Seats['status']) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            const statusMap = { 'available': 1, 'occupied': 2, 'maintenance': 3, 'sold': 2 };
            await unitService.updateUnit(token, id, { status: statusMap[newStatus] }, tenantId);
            loadData();
        } catch (error) {
            console.error('Status update error:', error);
        }
    };

    const resetForm = () => {
        setFormData({
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
            gallery: []
        });
        setEditingWorkspace(null);
        setIsSubmitting(false);
        setShowModal(false);
    };

    const getStatusBadge = (status: Seats['status']) => {
        const config = {
            available: { class: 'bg-success-soft text-success', text: 'Available' },
            occupied: { class: 'bg-danger-soft text-danger', text: 'Occupied' },
            maintenance: { class: 'bg-warning-soft text-warning', text: 'Maintenance' },
            sold: { class: 'bg-info-soft text-info', text: 'Sold' },
        };
        const c = config[status] || config.available;
        return <span className={`badge rounded-pill px-3 py-2 ${c.class}`}>{c.text}</span>;
    };

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="units">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Units</h1>
                        <p className="text-muted small mb-0">Manage Property Units</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={handleExport}>
                            <i className="bi bi-download"></i>
                            <span className="d-none d-md-inline">Export</span>
                        </button>
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-upload"></i>
                            <span className="d-none d-md-inline">Import</span>
                        </button>
                        <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-circle-fill"></i>
                            <span>Add Unit</span>
                        </button>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                                    <input type="text" className="form-control bg-light border-0" placeholder="Search by unit code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select bg-light border-0" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
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
                                <select className="form-select bg-light border-0" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="all">Status: All</option>
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-light border-0" value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
                                    <option value="all">Property: All</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-1 d-flex align-items-center justify-content-end gap-2">
                                {selectedUnits.length > 0 && (
                                    <button className="btn btn-sm btn-outline-danger border-0 hvr-danger" onClick={() => handleDelete(selectedUnits)} title="Delete Selected">
                                        <i className="bi bi-trash-fill"></i>
                                    </button>
                                )}
                                <span className="fw-bold text-primary">Total Units: {filteredUnits.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 pl-5" style={{ width: '40px' }}>
                                            <div className="form-check m-0 p-0 d-flex align-items-center justify-content-center">
                                                <input className="form-check-input mt-0 cursor-pointer shadow-none" type="checkbox" checked={selectedUnits.length === filteredUnits.length && filteredUnits.length > 0} onChange={toggleSelectAll} />
                                            </div>
                                        </th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Unit Details</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Property</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Type</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Pricing</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUnits.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-5">No units found</td></tr>
                                    ) : filteredUnits.map(unit => (
                                        <tr key={unit.id} className={selectedUnits.includes(unit.id) ? 'bg-light' : ''}>
                                            <td className="px-4 py-3">
                                                <div className="form-check m-0 p-0 d-flex align-items-center justify-content-center text-center">
                                                    <input className="form-check-input mt-0 cursor-pointer shadow-none" type="checkbox" checked={selectedUnits.includes(unit.id)} onChange={() => toggleSelect(unit.id)} />
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-bold text-dark">{unit.name}</div>
                                                <div className="small text-muted">{unit.bedrooms} BHK • {unit.sizeSqft} Sqft</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="small fw-medium">{unit.space?.name || 'Property'}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-capitalize small bg-light px-2 py-1 rounded text-muted">{unit.type}</span>
                                            </td>
                                            <td className="py-3">
                                                {unit.monthlyRate ? (
                                                    <div className="small fw-bold text-dark">${unit.monthlyRate}/mo</div>
                                                ) : (
                                                    <div className="small fw-bold text-dark">${unit.price}</div>
                                                )}
                                            </td>
                                            <td className="py-3">{getStatusBadge(unit.status)}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="dropdown">
                                                    <button className="btn btn-sm btn-icon btn-light border-0 rounded-circle" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                                        <li><button className="dropdown-item" onClick={() => handleEdit(unit)}><i className="bi bi-pencil me-2"></i>Edit</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleDuplicate(unit)}><i className="bi bi-files me-2"></i>Duplicate</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'available')}>Set Available</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'occupied')}>Set Occupied</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'sold')}>Set Sold</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item text-danger" onClick={() => handleDelete(unit.id)}><i className="bi bi-trash me-2"></i>Delete</button></li>
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

            {/* Unit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">{editingWorkspace ? 'Edit Unit' : 'Add Unit'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Unit Code</label>
                                            <input type="text" className="form-control bg-light border-0 form-control-lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. APT-101" />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Unit Type</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} required>
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
                                            <label className="form-label fw-bold small text-uppercase text-muted">Property</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.spaceId} onChange={(e) => setFormData({ ...formData, spaceId: e.target.value })} required>
                                                <option value="">Choose Property...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Bedrooms</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })} min="0" />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Bathrooms</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })} min="0" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Furnishing</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.furnishing} onChange={(e) => setFormData({ ...formData, furnishing: parseInt(e.target.value) })}>
                                                <option value={1}>Unfurnished</option>
                                                <option value={2}>Semi-Furnished</option>
                                                <option value={3}>Fully Furnished</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Parking</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.parkingSlots} onChange={(e) => setFormData({ ...formData, parkingSlots: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Facing</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: parseInt(e.target.value) })}>
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

                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Size (Sqft)</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.sizeSqft} onChange={(e) => setFormData({ ...formData, sizeSqft: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Floor Number</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.floorNo} onChange={(e) => setFormData({ ...formData, floorNo: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Monthly Rent ($)</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.monthlyRate} onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Sale Price ($)</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Main Image</label>
                                            <div className="border-2 border-dashed rounded-4 p-3 text-center cursor-pointer bg-light hvr-light" onClick={() => { setMediaModalType('main'); setShowMediaModal(true); }}>
                                                {formData.mainImageId && mediaItems.find(m => m.id === formData.mainImageId)?.url ? (
                                                    <img src={mediaItems.find(m => m.id === formData.mainImageId)?.url} style={{ maxHeight: '100px' }} className="rounded shadow-sm" />
                                                ) : (
                                                    <div className="py-2 text-muted"><i className="bi bi-image d-block h4"></i> Select Image</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Gallery</label>
                                            <div className="row g-2">
                                                {formData.gallery && formData.gallery.map((imgId: string, idx: number) => (
                                                    <div key={idx} className="col-3">
                                                        <div className="position-relative aspect-ratio-square bg-light rounded shadow-sm overflow-hidden">
                                                            {mediaItems.find(m => m.id === imgId)?.url && (
                                                                <img src={mediaItems.find(m => m.id === imgId)?.url} className="w-100 h-100 object-fit-cover" />
                                                            )}
                                                            <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle" style={{ width: '18px', height: '18px', fontSize: '10px' }} onClick={() => setFormData({ ...formData, gallery: (formData.gallery || []).filter((id: string) => id !== imgId) })}>×</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="col-3">
                                                    <div className="aspect-ratio-square border-2 border-dashed rounded d-flex align-items-center justify-content-center cursor-pointer bg-light hvr-light" onClick={() => { setMediaModalType('gallery'); setShowMediaModal(true); }}>
                                                        <i className="bi bi-plus text-primary"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer border-0 p-4 pt-0">
                                            <button type="button" className="btn btn-light px-4 fw-bold" onClick={resetForm}>Discard</button>
                                            <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={isSubmitting}>
                                                {isSubmitting ? 'Saving...' : editingWorkspace ? 'Save Changes' : 'Create Unit'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Import Modal */}
            {showImportModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">Import Units</h4>
                                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {importStep === 'file' && (
                                    <div className="text-center py-5 border-2 border-dashed rounded-4 bg-light">
                                        <i className="bi bi-file-earmark-excel h1 text-primary mb-3 d-block"></i>
                                        <h5>Choose CSV File</h5>
                                        <p className="text-muted small mb-4">Select a .csv file containing unit details</p>
                                        <input type="file" accept=".csv" className="d-none" id="csv-upload" onChange={handleFileChange} />
                                        <label htmlFor="csv-upload" className="btn btn-primary px-4 fw-bold cursor-pointer">Select File</label>
                                    </div>
                                )}

                                {importStep === 'mapping' && (
                                    <div>
                                        <div className="mb-4">
                                            <label className="form-label fw-bold small text-muted text-uppercase">1. Target Property</label>
                                            <select className="form-select bg-light border-0" value={formData.spaceId} onChange={(e) => setFormData({ ...formData, spaceId: e.target.value })}>
                                                <option value="">Choose Property for Imported Units...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <label className="form-label fw-bold small text-muted text-uppercase mb-3">2. Field Mapping (Advanced)</label>
                                        <div className="row g-2 overflow-auto" style={{ maxHeight: '400px' }}>
                                            {['unitCode', 'type', 'price', 'monthlyRate', 'sizeSqft', 'floorNo', 'bedrooms', 'bathrooms', 'furnishing', 'parkingSlots', 'facing'].map(field => (
                                                <div key={field} className="col-md-6 mb-2">
                                                    <div className="p-2 bg-light rounded shadow-xs border d-flex align-items-center">
                                                        <div className="flex-grow-1 small fw-bold text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</div>
                                                        <select
                                                            className="form-select form-select-sm border-0 bg-white shadow-none"
                                                            style={{ width: '150px' }}
                                                            value={mapping[field] || ''}
                                                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                                        >
                                                            <option value="">Skip</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-3 border-top d-flex justify-content-between">
                                            <button className="btn btn-light px-4" onClick={() => setImportStep('file')}>Back</button>
                                            <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={executeImport}>Execute Import ({csvRows.length} units)</button>
                                        </div>
                                    </div>
                                )}

                                {importStep === 'progress' && (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3 text-opacity-75" style={{ width: '3rem', height: '3rem' }}></div>
                                        <h5>Importing Data...</h5>
                                        <p className="text-muted mb-4">Processing {importProgress} of {importTotal} records</p>
                                        <div className="progress rounded-pill bg-light" style={{ height: '12px', maxWidth: '400px', margin: '0 auto' }}>
                                            <div
                                                className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                                style={{ width: `${(importProgress / importTotal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MediaSelector
                show={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                multiple={mediaModalType === 'gallery'}
                onSelect={(selection) => {
                    if (mediaModalType === 'main') {
                        const media = selection as MediaItem;
                        setFormData({ ...formData, mainImageId: media.id });
                    } else {
                        const mediaList = selection as MediaItem[];
                        const newIds = mediaList.map(m => m.id);
                        setFormData({
                            ...formData,
                            gallery: Array.from(new Set([...(formData.gallery || []), ...newIds]))
                        });
                    }
                }}
                selectedIds={mediaModalType === 'main' ? (formData.mainImageId ? [formData.mainImageId] : []) : (formData.gallery || [])}
                title={mediaModalType === 'main' ? 'Select Unit Image' : 'Add to Gallery'}
            />

            <style jsx>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .extra-small { font-size: 11px; }
                .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0; }
                .hvr-danger:hover { color: #dc3545 !important; transform: scale(1.1); transition: all 0.2s; }
                .cursor-pointer { cursor: pointer; }
            `}</style>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout >
    );
}
