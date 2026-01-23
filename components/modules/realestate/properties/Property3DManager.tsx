'use client';

import { useState, useEffect } from 'react';
import { property3DService, getAuthToken, unitService } from '@/app/services/api';

import VisualEditor from './VisualEditor';

interface Property3DManagerProps {
    propertyId: string;
    propertyName: string;
    initialMode?: 'json' | 'visual';
    onClose: () => void;
}

export default function Property3DManager({ propertyId, propertyName, initialMode = 'json', onClose }: Property3DManagerProps) {
    const displayPropertyName = propertyName && propertyName !== 'undefined' ? propertyName : 'Property';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'json' | 'visual'>(initialMode);
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

    useEffect(() => {
        loadData();
    }, [propertyId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            // Load Units for reference
            const unitsRes = await unitService.getUnits(token, { propertyId });
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
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white p-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">3D Workspace Architect: {displayPropertyName}</h5>
                <button className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="btn-group" role="group">
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
                    </div>

                    <div>
                        <button className="btn btn-light me-2 rounded-pill px-4" onClick={onClose}>Discard</button>
                        <button
                            className="btn btn-primary rounded-pill px-4 shadow"
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
                ) : (
                    <div style={{ height: '650px', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                        <VisualEditor
                            units={units}
                            layout={layout}
                            config={config}
                            onLayoutChange={setLayout}
                            onConfigChange={setConfig}
                        />
                    </div>
                )}
            </div>
            <style jsx>{`
                .extra-small { font-size: 11px; }
            `}</style>
        </div>
    );
}
