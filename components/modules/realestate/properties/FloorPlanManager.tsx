'use client';

import { useState, useRef } from 'react';
import Workspace3D from '@/components/Workspace3D';
import { Seats } from '@/types';

interface FloorPlan {
    id: string;
    name: string;
    description: string;
    layout: any[];
    config: any;
    thumbnail?: string;
    type: '2bhk' | '3bhk' | 'studio' | 'villas' | 'commercial';
    customization?: {
        wallColor: string;
        floorColor: string;
        aerialView: boolean;
    };
}

interface FloorPlanManagerProps {
    propertyId: string;
    units: any[];
    layouts: FloorPlan[];
    onSave: (plans: FloorPlan[]) => void;
}

export default function FloorPlanManager({ propertyId, units, layouts, onSave }: FloorPlanManagerProps) {
    const [plans, setPlans] = useState<FloorPlan[]>(layouts.length > 0 ? layouts : [
        {
            id: 'concept-1',
            name: 'Prime Concept 1',
            description: 'Minimalist 3-bedroom concept with open floor plan',
            type: 'commercial',
            layout: [
                { id: 'f1', unitCode: 'Grand Floor', type: 'flat', position: { x: 0, y: 0.1, z: 0 }, dimensions: { w: 15, h: 0.1, d: 15 }, color: '#f1f5f9' },
                { id: 'w1', unitCode: 'North Wall', type: 'villa', position: { x: 0, y: 1.5, z: -7.5 }, dimensions: { w: 15, h: 3, d: 0.2 }, color: '#ffffff' },
                { id: 'w2', unitCode: 'South Wall', type: 'villa', position: { x: 0, y: 1.5, z: 7.5 }, dimensions: { w: 15, h: 3, d: 0.2 }, color: '#ffffff' },
                { id: 'w3', unitCode: 'East Wall', type: 'villa', position: { x: 7.5, y: 1.5, z: 0 }, dimensions: { w: 0.2, h: 3, d: 15 }, color: '#ffffff' },
                { id: 'w4', unitCode: 'West Wall', type: 'villa', position: { x: -7.5, y: 1.5, z: 0 }, dimensions: { w: 0.2, h: 3, d: 15 }, color: '#ffffff' },
            ],
            config: { scene: { background: '#ffffff' }, camera: { position: { x: 0, y: 25, z: 0.1 } } },
            customization: { wallColor: '#ffffff', floorColor: '#f1f5f9', aerialView: true }
        }
    ]);
    const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Safety: Limit file size to 10MB to prevent browser hang
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large (max 10MB). Please optimize the CAD file by removing unnecessary layers/text before uploading.');
            setIsExtracting(false);
            return;
        }

        setIsExtracting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target?.result as string;
            let parsedLayout: any[] = [];

            if (file.name.toLowerCase().endsWith('.svg')) {
                parsedLayout = await extract3DFromSVG(content);
            } else if (file.name.toLowerCase().endsWith('.dxf')) {
                parsedLayout = await extract3DFromDXF(content);
            } else if (file.name.toLowerCase().endsWith('.dwg')) {
                alert("AutoCAD .dwg is a binary format. For automatic 3D extraction, please 'Save As' .dxf (ASCII) or 'Export' as .svg from AutoCAD.");
                setIsExtracting(false);
                return;
            }

            if (parsedLayout.length > 0) {
                const newPlan: FloorPlan = {
                    id: `fp-${Date.now()}`,
                    name: file.name.replace(/\.(svg|dxf)$/i, ''),
                    description: `Automatic 3D build from ${file.name.split('.').pop()?.toUpperCase()} CAD file`,
                    type: '2bhk',
                    layout: parsedLayout,
                    config: { scene: { background: '#ffffff' }, camera: { position: { x: 10, y: 15, z: 10 } } },
                    customization: {
                        wallColor: '#ffffff',
                        floorColor: '#e2e8f0',
                        aerialView: true
                    }
                };
                const updatedPlans = [...plans, newPlan];
                setPlans(updatedPlans);
                onSave(updatedPlans);
                setSelectedPlan(newPlan);
            }
            setIsExtracting(false);
        };

        reader.readAsText(file);
    };

    const extract3DFromDXF = async (dxfContent: string): Promise<any[]> => {
        // Simple DXF Parser (ASCII)
        // Entities to look for: LINE (10, 20, 11, 21), LWPOLYLINE (10, 20)
        const lines = dxfContent.split(/\r?\n/);
        const elements: any[] = [];
        let currentEntity: any = null;
        const MAX_ENTITIES = 500;
        let scale = 0.01; // DXF units (mm) to Meters

        for (let i = 0; i < lines.length && elements.length < MAX_ENTITIES; i++) {
            const line = lines[i].trim();
            if (line === 'LINE') {
                if (currentEntity && currentEntity.pts.length >= 2) elements.push(currentEntity);
                currentEntity = { type: 'villa', pts: [{}, {}] };
            } else if (line === 'LWPOLYLINE') {
                if (currentEntity && currentEntity.pts.length >= 2) elements.push(currentEntity);
                currentEntity = { type: 'villa', pts: [] };
            }

            if (currentEntity) {
                if (line === '10') {
                    if (currentEntity.pts.length < 2) currentEntity.pts[0].x = parseFloat(lines[i + 1]) * scale;
                    else currentEntity.pts.push({ x: parseFloat(lines[i + 1]) * scale });
                }
                if (line === '20') {
                    if (currentEntity.pts.length < 2) currentEntity.pts[0].z = parseFloat(lines[i + 1]) * scale;
                    else {
                        const lastPt = currentEntity.pts[currentEntity.pts.length - 1];
                        if (lastPt && lastPt.x !== undefined) lastPt.z = parseFloat(lines[i + 1]) * scale;
                        else currentEntity.pts.push({ z: parseFloat(lines[i + 1]) * scale });
                    }
                }
                if (line === '11') currentEntity.pts[1].x = parseFloat(lines[i + 1]) * scale;
                if (line === '21') currentEntity.pts[1].z = parseFloat(lines[i + 1]) * scale;
            }
        }
        if (currentEntity && currentEntity.pts.length >= 2) elements.push(currentEntity);

        // Convert raw points to ThreeD items
        const threeDElements: any[] = [];
        elements.forEach((el, idx) => {
            if (el.pts.length === 2 && el.pts[0].x !== undefined && el.pts[0].z !== undefined && el.pts[1].x !== undefined && el.pts[1].z !== undefined) {
                // Handle LINE entities
                const p1 = el.pts[0];
                const p2 = el.pts[1];
                const midX = (p1.x + p2.x) / 2;
                const midZ = (p1.z + p2.z) / 2;
                const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));

                if (dist > 0.01) { // Only add if it has a meaningful length
                    threeDElements.push({
                        id: `dxf-${idx}`,
                        unitCode: `CAD-${idx}`,
                        type: el.type,
                        position: { x: midX, y: 1.5, z: midZ },
                        dimensions: { w: dist, h: 3, d: 0.2 },
                        rotation: { y: Math.atan2(p2.z - p1.z, p2.x - p1.x) }, // Radians for Three.js
                        color: '#ffffff'
                    });
                }
            } else if (el.pts.length > 1) {
                // Handle LWPOLYLINE by breaking it into segments
                for (let i = 0; i < el.pts.length - 1; i++) {
                    const p1 = el.pts[i];
                    const p2 = el.pts[i + 1];
                    if (p1.x !== undefined && p1.z !== undefined && p2.x !== undefined && p2.z !== undefined) {
                        const midX = (p1.x + p2.x) / 2;
                        const midZ = (p1.z + p2.z) / 2;
                        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));

                        if (dist > 0.01) {
                            threeDElements.push({
                                id: `dxf-${idx}-${i}`,
                                unitCode: `CAD-${idx}-${i}`,
                                type: el.type,
                                position: { x: midX, y: 1.5, z: midZ },
                                dimensions: { w: dist, h: 3, d: 0.2 },
                                rotation: { y: Math.atan2(p2.z - p1.z, p2.x - p1.x) },
                                color: '#ffffff'
                            });
                        }
                    }
                }
            }
        });

        return threeDElements;
    };

    const extract3DFromSVG = async (svgContent: string): Promise<any[]> => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return [];

        const width = parseFloat(svg.getAttribute('width') || '1000');
        const height = parseFloat(svg.getAttribute('height') || '1000');
        const scale = 0.05; // Conversion factor from SVG units to 3D meters

        const elements: any[] = [];
        const MAX_SVG_NODES = 500;

        // Extract Paths as Walls
        const paths = Array.from(doc.querySelectorAll('path, rect, polygon')).slice(0, MAX_SVG_NODES);
        paths.forEach((node, idx) => {
            try {
                let type = 'villa';
                let color = '#ffffff';
                let h = 3.0;

                const bbox = (node as any).getBBox?.() || { x: 0, y: 0, width: 0, height: 0 };

                // Safety: Skip invisible or tiny objects that cause noise
                if (bbox.width < 1 || bbox.height < 1) return;

                elements.push({
                    id: `node-${idx}`,
                    unitCode: `Wall ${idx}`,
                    type: (bbox.width > 50 && bbox.height > 50) ? 'flat' : 'villa', // Heuristic for floors vs walls
                    position: {
                        x: (bbox.x + bbox.width / 2 - width / 2) * scale,
                        y: (bbox.width > 50 && bbox.height > 50) ? 0.05 : 1.5,
                        z: (bbox.y + bbox.height / 2 - height / 2) * scale
                    },
                    dimensions: {
                        w: Math.max(bbox.width * scale, 0.2),
                        h: (bbox.width > 50 && bbox.height > 50) ? 0.1 : 3.0,
                        d: Math.max(bbox.height * scale, 0.2)
                    },
                    color: (bbox.width > 50 && bbox.height > 50) ? '#e2e8f0' : '#ffffff'
                });
            } catch (e) {
                console.warn('Skipping malformed SVG node', e);
            }
        });

        return elements;
    };

    const updateCustomization = (field: string, value: any) => {
        if (!selectedPlan) return;
        const updatedPlan = {
            ...selectedPlan,
            customization: { ...selectedPlan.customization!, [field]: value },
            layout: selectedPlan.layout.map(l => {
                if (field === 'wallColor' && l.type === 'villa') return { ...l, color: value };
                if (field === 'floorColor' && l.type === 'flat') return { ...l, color: value };
                return l;
            })
        };
        setSelectedPlan(updatedPlan);
        const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
        setPlans(updatedPlans);
        onSave(updatedPlans);
    };

    return (
        <div className="d-flex h-100 bg-white">
            {/* Sidebar: Plan List */}
            <div className="border-end shadow-sm flex-shrink-0" style={{ width: '300px', backgroundColor: '#f8fafc' }}>
                <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Floor Plan Gallery</h6>
                    <button
                        className="btn btn-primary btn-sm rounded-circle shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload CAD File"
                    >
                        <i className="bi bi-plus-lg"></i>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept=".svg,.dxf,.dwg"
                        onChange={handleFileUpload}
                    />
                    <div className="extra-small text-muted mt-2 opacity-75">
                        <i className="bi bi-info-circle me-1"></i>
                        Use .dxf or .svg for 3D build
                    </div>
                </div>

                <div className="p-3 overflow-auto" style={{ height: 'calc(100% - 75px)' }}>
                    {isExtracting && (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary mb-2"></div>
                            <p className="extra-small text-muted">Analyzing CAD Geometry...</p>
                        </div>
                    )}

                    {plans.length === 0 && !isExtracting && (
                        <div className="text-center p-5 mt-5">
                            <i className="bi bi-layers-half fs-1 text-muted opacity-25"></i>
                            <p className="small text-muted mt-3">No plans assigned to this property yet.</p>
                        </div>
                    )}

                    <div className="d-flex flex-column gap-3">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className={`card cursor-pointer border-0 shadow-sm rounded-4 overflow-hidden transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary shadow-lg scale-102' : 'hover-shadow'}`}
                                onClick={() => setSelectedPlan(plan)}
                            >
                                <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="fw-bold extra-small mb-0">{plan.name}</h6>
                                        <span className={`badge ${plan.type === 'villas' ? 'bg-primary' : 'bg-info'} extra-small`}>{plan.type}</span>
                                    </div>
                                    <p className="extra-small text-muted mb-0">{plan.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area: 3D Preview & Customizer */}
            <div className="flex-grow-1 position-relative bg-light overflow-hidden">
                {selectedPlan ? (
                    <div className="h-100 d-flex flex-column">
                        {/* Header with Customizer */}
                        <div className="p-3 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-4">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="extra-small fw-bold text-muted">Wall Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-xs p-0 border-0"
                                        value={selectedPlan.customization?.wallColor || '#ffffff'}
                                        onChange={(e) => updateCustomization('wallColor', e.target.value)}
                                        style={{ width: '25px', height: '25px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <label className="extra-small fw-bold text-muted">Floor Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-xs p-0 border-0"
                                        value={selectedPlan.customization?.floorColor || '#e2e8f0'}
                                        onChange={(e) => updateCustomization('floorColor', e.target.value)}
                                        style={{ width: '25px', height: '25px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div className="form-check form-switch pt-1">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="aerialToggle"
                                        checked={selectedPlan.customization?.aerialView}
                                        onChange={(e) => updateCustomization('aerialView', e.target.checked)}
                                    />
                                    <label className="form-check-label extra-small fw-bold text-muted" htmlFor="aerialToggle">Aerial View Mode</label>
                                </div>
                            </div>
                            <div className="badge bg-dark rounded-pill px-3 py-2">
                                <i className="bi bi-layers me-2"></i>
                                {selectedPlan.layout.length} CAD Entities Extracted
                            </div>
                        </div>

                        {/* 3D Preview Section */}
                        <div className="flex-grow-1 position-relative bg-white">
                            <Workspace3D
                                workspaces={selectedPlan.layout.map((l: any) => ({
                                    id: l.id,
                                    name: l.unitCode || 'Wall',
                                    slug: l.id,
                                    type: (l.type === 'flat' ? 'studio' : 'villa') as any,
                                    status: 'available',
                                    features: [],
                                    spaceId: propertyId,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                } as Seats)) as Seats[]}
                                layout={selectedPlan.layout}
                                config={{
                                    ...selectedPlan.config,
                                    camera: {
                                        ...selectedPlan.config.camera,
                                        position: selectedPlan.customization?.aerialView
                                            ? { x: 0, y: 25, z: 0.1 } // Force Top-Down
                                            : selectedPlan.config.camera.position
                                    }
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                        <i className="bi bi-box-seam display-1 opacity-10"></i>
                        <h5 className="mt-4 fw-bold">Select a plan to preview in 3D</h5>
                        <p className="small">Upload a CAD SVG to get started.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .scale-102 { transform: scale(1.02); }
                .transition-all { transition: all 0.2s ease; }
                .hover-shadow:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                .ring-2 { box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.5); }
                .form-control-xs { height: 25px; padding: 2px; }
            `}</style>
        </div>
    );
}
