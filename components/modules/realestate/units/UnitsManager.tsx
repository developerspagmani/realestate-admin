'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { unitService, propertyService, mediaService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { Seats, Property, MediaItem } from '@/types';
import MainLayout from '@/components/MainLayout';
import MediaSelector from '@/components/shared/MediaSelector';

interface UnitsManagerProps {
    mode: 'admin' | 'owner';
}

export default function UnitsManager({ mode }: UnitsManagerProps) {
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
        type: 'desk',
        capacity: 1,
        floorNo: 0,
        sizeSqft: 0,
        hourlyRate: 0,
        dailyRate: 0,
        monthlyRate: 0,
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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
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
            const industryType = mode === 'admin' ? tenantType : undefined;

            // Load properties first to map spaceId to property names
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

            // Load units
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
                    const hourly = u.unitPricing?.find((p: any) => p.pricingModel === 2)?.price || 0;
                    const daily = u.unitPricing?.find((p: any) => p.pricingModel === 3)?.price || 0;
                    const monthly = u.unitPricing?.find((p: any) => p.pricingModel === 4)?.price || 0;

                    return {
                        id: u.id,
                        name: u.unitCode || 'Unit ' + u.id.substring(0, 4),
                        slug: u.slug || u.id,
                        type: u.unitCategory === 1 ? 'desk' : u.unitCategory === 2 ? 'office' : u.unitCategory === 3 ? 'meeting_room' : 'event_space',
                        capacity: u.capacity || 1,
                        floorNo: u.floorNo || 0,
                        sizeSqft: u.sizeSqft || 0,
                        hourlyRate: parseFloat(hourly),
                        dailyRate: parseFloat(daily),
                        monthlyRate: parseFloat(monthly),
                        spaceId: u.propertyId,
                        space: prop as any,
                        features: u.unitAmenities?.map((a: any) => a.amenity?.name) || [],
                        status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : 'maintenance',
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
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');

            const unitCategoryMap = { 'desk': 1, 'office': 2, 'meeting_room': 3, 'event_space': 4 };
            const statusMap = { 'available': 1, 'occupied': 2, 'maintenance': 3 };

            const payload = {
                tenantId,
                propertyId: formData.spaceId,
                unitCode: formData.name,
                slug: formData.slug || undefined,
                unitCategory: unitCategoryMap[formData.type as keyof typeof unitCategoryMap] || 1,
                capacity: formData.capacity,
                floorNo: formData.floorNo,
                sizeSqft: formData.sizeSqft,
                status: statusMap[formData.status as keyof typeof statusMap] || 1,
                hourlyRate: formData.hourlyRate,
                dailyRate: formData.dailyRate,
                monthlyRate: formData.monthlyRate,
                currency: 'USD',
                mainImageId: formData.mainImageId,
                gallery: formData.gallery
            };

            if (!token || !tenantId) {
                alert('Session expired or tenant not found');
                return;
            }

            if (editingWorkspace) {
                await unitService.updateUnit(token, editingWorkspace.id, payload, tenantId);
                setSuccessMessage('Workspace updated successfully!');
            } else {
                await unitService.createUnit(token, payload, tenantId);
                setSuccessMessage('Workspace added successfully!');
            }

            loadData();
            setTimeout(() => { resetForm(); }, 1500);

        } catch (error) {
            console.error('Failed to save unit:', error);
            alert('Error saving unit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (seats: Seats) => {
        setEditingWorkspace(seats);
        setFormData({
            name: seats.name,
            slug: (seats as any).slug || '',
            type: seats.type,
            capacity: seats.capacity,
            floorNo: (seats as any).floorNo || 0,
            sizeSqft: (seats as any).sizeSqft || 0,
            hourlyRate: seats.hourlyRate,
            dailyRate: seats.dailyRate,
            monthlyRate: seats.monthlyRate,
            spaceId: seats.spaceId,
            status: seats.status,
            mainImageId: seats.mainImageId || '',
            gallery: seats.gallery || []
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this workspace?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            await unitService.deleteUnit(token, id, tenantId);
            loadData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: Seats['status']) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id') || '';
            const statusMap = { 'available': 1, 'occupied': 2, 'maintenance': 3 };
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
            type: 'desk',
            capacity: 1,
            floorNo: 0,
            sizeSqft: 0,
            hourlyRate: 0,
            dailyRate: 0,
            monthlyRate: 0,
            spaceId: '',
            features: [],
            status: 'available',
            mainImageId: '',
            gallery: []
        });
        setEditingWorkspace(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
        setShowModal(false);
    };

    const getStatusBadge = (status: Seats['status']) => {
        const config = {
            available: { class: 'bg-success-soft text-success', text: 'Available' },
            occupied: { class: 'bg-danger-soft text-danger', text: 'Occupied' },
            maintenance: { class: 'bg-warning-soft text-warning', text: 'Maintenance' }
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
                        <h1 className="h3 fw-bold mb-1">Workspaces & Units</h1>
                        <p className="text-muted small mb-0">Manage desks, offices and meeting rooms</p>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus-circle-fill"></i>
                        <span>Add Workspace</span>
                    </button>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                                    <input type="text" className="form-control bg-light border-0" placeholder="Search by unit code or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select bg-light border-0" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="all">Type: All</option>
                                    <option value="desk">Desk</option>
                                    <option value="office">Office</option>
                                    <option value="meeting_room">Meeting Room</option>
                                    <option value="event_space">Event Space</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select bg-light border-0" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="all">Status: All</option>
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="col-md-1 d-flex align-items-center justify-content-end">
                                <span className="fw-bold text-primary">{filteredUnits.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted">Workspace</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Property</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Type</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Rates</th>
                                        <th className="py-3 text-uppercase small fw-bold text-muted">Status</th>
                                        <th className="px-4 py-3 text-uppercase small fw-bold text-muted text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUnits.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-5">No workspaces found</td></tr>
                                    ) : filteredUnits.map(unit => (
                                        <tr key={unit.id}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold text-dark">{unit.name}</div>
                                                <div className="small text-muted">Capacity: {unit.capacity} persons</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="small fw-medium">{(unit.space as any)?.name || 'Property'}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-capitalize small bg-light px-2 py-1 rounded text-muted">{unit.type.replace('_', ' ')}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="small fw-bold text-dark">${unit.hourlyRate}/hr</div>
                                                <div className="extra-small text-muted">${unit.dailyRate}/day</div>
                                            </td>
                                            <td className="py-3">{getStatusBadge(unit.status)}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="dropdown">
                                                    <button className="btn btn-sm btn-icon btn-light border-0 rounded-circle" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                                        <li><button className="dropdown-item" onClick={() => handleEdit(unit)}><i className="bi bi-pencil me-2"></i>Edit</button></li>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'available')}>Set Available</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'occupied')}>Set Occupied</button></li>
                                                        <li><button className="dropdown-item" onClick={() => handleStatusChange(unit.id, 'maintenance')}>Set Maintenance</button></li>
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
                                <h4 className="fw-bold mb-0">{editingWorkspace ? 'Edit Workspace' : 'Add Workspace'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                                    <div className="row g-4">
                                        <div className="col-md-5">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Workspace Code / Name</label>
                                            <input type="text" className="form-control bg-light border-0 form-control-lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. DESK-001" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold small text-uppercase text-muted">URL Slug (Unique)</label>
                                            <input type="text" className="form-control bg-light border-0 form-control-lg" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} placeholder="e.g. desk-001" />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Workspace Type</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} required>
                                                <option value="desk">Desk</option>
                                                <option value="office">Private Office</option>
                                                <option value="meeting_room">Meeting Room</option>
                                                <option value="event_space">Event Space</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Property Location</label>
                                            <select className="form-select bg-light border-0 form-control-lg" value={formData.spaceId} onChange={(e) => setFormData({ ...formData, spaceId: e.target.value })} required>
                                                <option value="">Choose Property...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Capacity</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} min="1" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Floor Number</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.floorNo} onChange={(e) => setFormData({ ...formData, floorNo: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Size (Sqft)</label>
                                            <input type="number" className="form-control bg-light border-0 form-control-lg" value={formData.sizeSqft} onChange={(e) => setFormData({ ...formData, sizeSqft: parseInt(e.target.value) })} />
                                        </div>
                                        <div className="col-12">
                                            <div className="p-3 bg-light rounded-4">
                                                <h6 className="fw-bold mb-3 small text-uppercase">Pricing Plans</h6>
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Hourly Rate ($)</label>
                                                        <input type="number" className="form-control border-0" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })} step="0.01" />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Daily Rate ($)</label>
                                                        <input type="number" className="form-control border-0" value={formData.dailyRate} onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })} step="0.01" />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Monthly Rate ($)</label>
                                                        <input type="number" className="form-control border-0" value={formData.monthlyRate} onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) })} step="0.01" />
                                                    </div>
                                                </div>
                                            </div>
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
                                            <label className="form-label small fw-bold text-muted text-uppercase">Unit Gallery</label>
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
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={resetForm}>Discard</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : editingWorkspace ? 'Save Changes' : 'Create Workspace'}
                                    </button>
                                </div>
                            </form>
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
                title={mediaModalType === 'main' ? 'Select Workspace Image' : 'Add to Gallery'}
            />

            <style jsx>{`
            .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
            .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
            .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
            .extra-small { font-size: 11px; }
            .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0; }
       `}</style>
        </MainLayout>
    );
}
