'use client';

import { useState, useEffect } from 'react';
import { property3DService, getAuthToken, unitService } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Workspace3D from '@/components/Workspace3D';
import VisualEditor from './VisualEditor';
import FloorPlanManager from '@/components/modules/realestate/properties/FloorPlanManager';
import { DEMO_HOUSE_PLANS } from '@/app/constants/demoPlans';

interface Property3DManagerProps {
    propertyId: string;
    propertyName: string;
    initialMode?: 'visual' | 'json' | '3d' | 'floorplans';
    onClose: () => void;
}

export default function Property3DManager({ propertyId, propertyName, initialMode = 'visual', onClose }: Property3DManagerProps) {
    const { activeTenantId, activeOwnerId, tenantType } = useManagementContext();
    const displayPropertyName = propertyName && propertyName !== 'undefined' ? propertyName : 'Property';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'visual' | 'json' | '3d' | 'floorplans'>(initialMode);
    const [units, setUnits] = useState<any[]>([]);
    const [config, setConfig] = useState<any>({
        scene: {
            background: '#f0f0f0',
            ambientLight: 0.6,
            directionalLight: 0.8
        },
        camera: {
            position: { x: 0, y: 15, z: 20 },
            lookAt: { x: 0, y: 0, z: 0 }
        }
    });
    const [layout, setLayout] = useState<any[]>([]);
    const [tourData, setTourData] = useState<any>(null);

    // Demo House Plan State
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [selectedPlot, setSelectedPlot] = useState<any>(null);
    const [activeDemoTour, setActiveDemoTour] = useState<any>(null);
    const [suggestedPlans, setSuggestedPlans] = useState<any[]>([]);

    const handleOpenDemoPlans = (unit: any) => {
        setSelectedPlot(unit);

        // Check if layout has a preferred plan assigned in metadata
        const layoutObj = layout.find(l => (l.unitId || l.id) === unit.id);
        const preferredId = layoutObj?.metadata?.preferredPlanId;

        if (preferredId) {
            const plan = DEMO_HOUSE_PLANS.find(p => p.id === preferredId);
            if (plan) {
                setActiveDemoTour(plan);
                return;
            }
        }

        // Otherwise suggest plans based on sqft
        const sqft = unit.sizeSqft || 1000;
        let tier = 'Small (< 1200 Sqft)';
        if (sqft >= 1200 && sqft <= 2500) tier = 'Medium (1200-2500 Sqft)';
        else if (sqft > 2500) tier = 'Large (> 2500 Sqft)';

        const filtered = DEMO_HOUSE_PLANS.filter(p => p.tier === tier);
        // If not enough in tier, show some others
        if (filtered.length < 3) {
            const others = DEMO_HOUSE_PLANS.filter(p => p.tier !== tier).slice(0, 3 - filtered.length);
            setSuggestedPlans([...filtered, ...others]);
        } else {
            setSuggestedPlans(filtered.slice(0, 3));
        }
        setShowDemoModal(true);
    };

    useEffect(() => {
        loadData();
    }, [propertyId, activeTenantId, activeOwnerId, tenantType]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;
            const industryType = (!activeOwnerId && !activeTenantId) ? tenantType : undefined;

            // Load Units for reference
            const unitsRes = await unitService.getUnits(token, {
                propertyId,
                tenantId: activeTenantId || undefined,
                ownerId: activeOwnerId || undefined,
                industryType
            });
            let loadedUnits = [];
            if (unitsRes.success) {
                loadedUnits = unitsRes.data?.units || unitsRes.data || [];
                setUnits(loadedUnits);
            }

            // Load existing 3D config
            const configRes = await property3DService.getByPropertyId(token, propertyId);
            if (configRes.success && configRes.data) {
                if (configRes.data.config) setConfig(configRes.data.config);
                if (configRes.data.layout) setLayout(configRes.data.layout);
                if (configRes.data.tourData) setTourData(configRes.data.tourData);
            } else {
                // Initialize default layout from units
                const initialLayout = loadedUnits.map((unit: any, index: number) => ({
                    unitId: unit.id,
                    unitCode: unit.unitCode,
                    type: unit.coworkingDetails?.seatType === 2 ? 'cabin' : 'seat',
                    position: { x: (index % 5) * 3 - 6, y: 0.5, z: Math.floor(index / 5) * 3 - 6 },
                    dimensions: { w: 1, h: 1, d: 1 },
                    color: '#7cff4d'
                }));
                setLayout(initialLayout);
            }
        } catch (error) {
            console.error('Failed to load 3D configuration data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = getAuthToken();
            if (!token) return;

            const response = await property3DService.saveConfig(token, propertyId, {
                config,
                layout,
                tourData: tourData || {
                    hotspots: [
                        { id: '1', name: 'Living Room', description: 'Sample hotspot', position: [-4, 2, -2], price: '18,50,000', area: '200 sq.ft' }
                    ],
                    materials: []
                },
                status: 1
            });

            if (response.success) {
                alert('3D Configuration saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save 3D config:', error);
            alert('Error saving configuration.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card border-0 shadow-none rounded-0 overflow-hidden">
            <div className="card-header bg-primary text-white p-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">3D Workspace Architect: {displayPropertyName}</h5>
                <button className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="container-fluid">
                <div className="card-body p-0">
                    <div className="d-flex justify-content-between align-items-center p-4">
                        <div className="btn-group gap-2" role="group">

                            <input
                                type="radio"
                                className="btn-check"
                                name="viewMode"
                                id="viewVisual"
                                autoComplete="off"
                                checked={viewMode === 'visual'}
                                onChange={() => setViewMode('visual')}
                            />
                            <label className="btn btn-outline-primary btn-sm px-3" htmlFor="viewVisual">
                                <i className="bi bi-map me-2"></i>Visual Map Editor
                            </label>
                            <input
                                type="radio"
                                className="btn-check"
                                name="viewMode"
                                id="view3d"
                                autoComplete="off"
                                checked={viewMode === '3d'}
                                onChange={() => setViewMode('3d')}
                            />
                            <label className="btn btn-outline-info btn-sm px-3" htmlFor="view3d">
                                <i className="bi bi-box me-2"></i>3D Preview
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="viewMode"
                                id="viewFloorplans"
                                autoComplete="off"
                                checked={viewMode === 'floorplans'}
                                onChange={() => setViewMode('floorplans')}
                            />
                            <label className="btn btn-outline-info btn-sm px-3" htmlFor="viewFloorplans">
                                <i className="bi bi-layers me-2"></i>Floor Plans
                            </label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="viewMode"
                                id="viewJson"
                                autoComplete="off"
                                checked={viewMode === 'json'}
                                onChange={() => setViewMode('json')}
                            />
                            <label className="btn btn-outline-secondary btn-sm px-3" htmlFor="viewJson">
                                <i className="bi bi-code-slash me-2"></i>JSON Editor
                            </label>
                        </div>

                        <div>
                            <button className="btn btn-light me-2 rounded-4 px-4" onClick={onClose}>Discard</button>
                            <button
                                className="btn btn-primary rounded-4 px-4 shadow"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save & Publish 3D Layout'}
                            </button>
                        </div>
                    </div>
                    {viewMode === 'json' ? (
                        <>
                            <div className="row">
                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3"><i className="bi bi-camera-reels me-2"></i>Scene & Camera Config (JSON)</h6>
                                    <textarea
                                        className="form-control font-monospace extra-small bg-dark text-success p-3 rounded-3"
                                        rows={10}
                                        value={JSON.stringify(config, null, 2)}
                                        onChange={(e) => {
                                            try { setConfig(JSON.parse(e.target.value)); } catch (e) { }
                                        }}
                                    ></textarea>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold mb-3"><i className="bi bi-grid-3x3 me-2"></i>Workspace Layout (JSON)</h6>
                                    <textarea
                                        className="form-control font-monospace extra-small bg-dark text-info p-3 rounded-3"
                                        rows={10}
                                        value={JSON.stringify(layout, null, 2)}
                                        onChange={(e) => {
                                            try { setLayout(JSON.parse(e.target.value)); } catch (e) { }
                                        }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-4 bg-light rounded-3 p-3">
                                <h6 className="fw-bold small mb-2 text-muted">Field Reference Mapping:</h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {units.map(u => (
                                        <span key={u.id} className="badge bg-white text-dark shadow-sm border py-2 px-3 small">
                                            {u.unitCode} <span className="text-muted ms-1 opacity-50">({u.id.substring(0, 8)})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : viewMode === 'visual' ? (
                        <div style={{ height: 'calc(100vh - 165px)', borderTop: '1px solid #dee2e6' }}>
                            <VisualEditor
                                units={units}
                                layout={layout}
                                config={config}
                                onLayoutChange={setLayout}
                                onConfigChange={setConfig}
                            />
                        </div>
                    ) : viewMode === '3d' ? (
                        <div style={{ height: '650px', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                            <Workspace3D
                                workspaces={units.map(u => ({
                                    id: u.id,
                                    name: u.unitCode,
                                    slug: u.slug || u.id,
                                    type: (u.coworkingDetails?.seatType === 2 ? 'villa' : 'office') as any, // Map to valid Seats types
                                    status: (u.status === 1 ? 'available' : (u.status === 2 ? 'occupied' : 'maintenance')) as any,
                                    hourlyRate: parseFloat(u.unitPricing?.[0]?.price || '0'),
                                    capacity: u.capacity || 1,
                                    sizeSqft: u.sizeSqft || (Math.random() * 2000 + 500), // Fallback for demo
                                    features: [],
                                    spaceId: propertyId,
                                    createdAt: u.createdAt,
                                    updatedAt: u.updatedAt
                                }))}
                                layout={layout}
                                config={config}
                                onShowDemoPlans={handleOpenDemoPlans}
                            />
                        </div>
                    ) : (
                        <div style={{ height: 'calc(100vh - 165px)' }}>
                            <FloorPlanManager
                                propertyId={propertyId}
                                units={units}
                                layouts={tourData?.floorPlans || []}
                                onSave={(newPlans) => {
                                    const updatedTourData = { ...tourData, floorPlans: newPlans };
                                    setTourData(updatedTourData);
                                    // Auto-save logic if needed
                                }}
                            />
                        </div>
                    )}

                    {/* Demo Plans Modal */}
                    {showDemoModal && selectedPlot && (
                        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060, backdropFilter: 'blur(5px)' }}>
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content border-0 shadow-lg rounded-5 overflow-hidden">
                                    <div className="modal-header border-0 p-4">
                                        <div>
                                            <h4 className="fw-bold mb-0 text-primary">Suggesting House Plans</h4>
                                            <p className="extra-small text-muted mb-0">Based on plot <strong>{selectedPlot.name}</strong> ({selectedPlot.sizeSqft || 1000} Sqft)</p>
                                        </div>
                                        <button type="button" className="btn-close" onClick={() => setShowDemoModal(false)}></button>
                                    </div>
                                    <div className="modal-body p-4 pt-0">
                                        <div className="row g-4 mb-4">
                                            {suggestedPlans.map(plan => (
                                                <div key={plan.id} className="col-md-4">
                                                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hvr-translate-up">
                                                        <img src={plan.preview} className="card-img-top" alt={plan.name} style={{ height: '140px', objectFit: 'cover' }} />
                                                        <div className="card-body p-3">
                                                            <h6 className="fw-bold mb-1 small">{plan.name}</h6>
                                                            <p className="extra-small text-muted mb-3" style={{ height: '40px', overflow: 'hidden' }}>{plan.description}</p>
                                                            <button
                                                                className="btn btn-primary w-100 btn-sm rounded-4 fw-bold"
                                                                onClick={() => {
                                                                    setActiveDemoTour(plan);
                                                                    setShowDemoModal(false);
                                                                }}
                                                            >
                                                                3D Tour
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            <button className="btn btn-link link-muted extra-small py-0" onClick={() => setShowDemoModal(false)}>Close Suggestions</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3D House Plan Tour Viewer */}
                    {activeDemoTour && (
                        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
                            <div className="modal-dialog modal-fullscreen">
                                <div className="modal-content bg-transparent border-0">
                                    <div className="modal-header border-0 p-4 position-absolute top-0 w-100" style={{ zIndex: 2001 }}>
                                        <div className="bg-white p-3 rounded-4 shadow-lg d-flex align-items-center gap-4 border border-info border-opacity-25">
                                            <div>
                                                <h5 className="fw-bold mb-0 text-dark">{activeDemoTour.name}</h5>
                                                <p className="extra-small text-muted mb-0 d-flex align-items-center gap-2">
                                                    <i className="bi bi-info-circle-fill text-info"></i>
                                                    3D Structural Visualization for Floor Planning
                                                </p>
                                            </div>
                                            <div className="vr opacity-10"></div>
                                            <div className="d-flex gap-3">
                                                <div className="text-center">
                                                    <span className="badge bg-primary-soft text-primary extra-small px-3 py-2 rounded-4">AESTHETIC VIBE</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-dark rounded-4 px-4 fw-bold shadow-sm"
                                                onClick={() => setActiveDemoTour(null)}
                                            >
                                                <i className="bi bi-x-lg me-2"></i> Close Tour
                                            </button>
                                        </div>
                                    </div>
                                    <div className="modal-body p-0">
                                        <Workspace3D
                                            workspaces={activeDemoTour.layout.map((l: any) => ({
                                                id: l.id,
                                                name: l.unitCode,
                                                type: l.type,
                                                status: 'available',
                                                features: [],
                                            }))}
                                            layout={activeDemoTour.layout}
                                            config={activeDemoTour.config}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <style jsx>{`
                .extra-small { font-size: 11px; }
            `}</style>
                </div>
            </div>
        </div>
    );
}
