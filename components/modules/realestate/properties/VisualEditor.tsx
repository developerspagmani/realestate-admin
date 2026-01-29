'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';

interface Marker {
    unitId: string;
    unitCode: string;
    type: 'seat' | 'cabin' | 'flat' | 'villa' | 'road' | 'tree' | 'drainage' | 'hills' | 'river' | 'lake';
    x: number; // pixel x
    y: number; // pixel y
    width?: number; // for rect
    height?: number; // for rect
    points?: { x: number; y: number }[]; // for polygon
    color?: string;
}

const SCENARIO_TYPES = [
    { id: 'road', name: 'Road', color: '#555555', icon: 'bi-signpost-split' },
    { id: 'tree', name: 'Tree', color: '#2d572c', icon: 'bi-tree-fill' },
    { id: 'drainage', name: 'Drainage', color: '#4a69bd', icon: 'bi-droplet-fill' },
    { id: 'hills', name: 'Hills', color: '#8d6e63', icon: 'bi-mountain' },
    { id: 'river', name: 'River', color: '#00bcd4', icon: 'bi-water' },
    { id: 'lake', name: 'Lake', color: '#03a9f4', icon: 'bi-tsunami' },
];

interface VisualEditorProps {
    units: any[];
    layout: any[];
    config: any;
    onLayoutChange: (newLayout: any[]) => void;
    onConfigChange: (newConfig: any) => void;
}

export default function VisualEditor({ units, layout, config, onLayoutChange, onConfigChange }: VisualEditorProps) {
    const [scale, setScale] = useState<number>(50); // px per unit (meter)
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [drawMode, setDrawMode] = useState<'pointer' | 'point' | 'rect' | 'poly' | 'text'>('pointer');
    const [tempPolyPoints, setTempPolyPoints] = useState<{ x: number; y: number }[]>([]);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [dragItemStartPos, setDragItemStartPos] = useState<{ x: number, y: number } | null>(null);
    const [draggingCornerIndex, setDraggingCornerIndex] = useState<number | null>(null);

    // New Features State
    const [showJson, setShowJson] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // History management
    const [history, setHistory] = useState<any[][]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // ... (keep useEffect for history Init) 
    useEffect(() => {
        if (history.length === 0 && layout.length > 0) {
            setHistory([layout]);
            setHistoryStep(0);
        }
    }, []);

    // ... (keep addToHistory, handleUndo, handleRedo)
    const addToHistory = (newLayout: any[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newLayout);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        onLayoutChange(newLayout);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            onLayoutChange(history[prevStep]);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            onLayoutChange(history[nextStep]);
        }
    };

    // Config state
    const [imageUrl, setImageUrl] = useState<string | null>(config?.scene?.floorPlan || null);

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ... (keep handleImageUpload)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImageUrl(result);
                onConfigChange({
                    ...config,
                    scene: { ...config.scene, floorPlan: result }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper to get pixel from world
    const getPixel = (pos: { x: number, z: number }) => {
        if (!imgRef.current) return { x: 0, y: 0 };
        const centerX = imgRef.current.width / 2;
        const centerY = imgRef.current.height / 2;
        return {
            x: (pos.x * scale) + centerX,
            y: (pos.z * scale) + centerY
        };
    };

    // Helper to get world from pixel
    const getWorld = (px: number, py: number) => {
        if (!imgRef.current) return { x: 0, z: 0 };
        const centerX = imgRef.current.width / 2;
        const centerY = imgRef.current.height / 2;
        return {
            x: (px - centerX) / scale,
            z: (py - centerY) / scale
        };
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageUrl || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (drawMode === 'pointer') {
            // Check for corner handles first
            if (selectedUnitId) {
                const item = layout.find(l => l.unitId === selectedUnitId);
                if (item && item.metadata?.polyPoints) {
                    const handles = item.metadata.polyPoints;
                    const handleIndex = handles.findIndex((p: any) => {
                        const px = getPixel({ x: p.x, z: p.z });
                        return Math.abs(x - px.x) < 10 && Math.abs(y - px.y) < 10;
                    });
                    if (handleIndex !== -1) {
                        setDraggingCornerIndex(handleIndex);
                        setIsDragging(true);
                        setDragStart({ x, y });
                        return;
                    }
                }
            }

            // Find item clicked
            const clickedItem = layout.slice().reverse().find(item => {
                const px = getPixel({ x: item.position.x, z: item.position.z });
                const size = (item.dimensions?.w || 1) * scale;
                // Simple hit test
                return Math.abs(x - px.x) < (size / 2 + 10) && Math.abs(y - px.y) < (size / 2 + 10);
            });

            if (clickedItem) {
                setSelectedUnitId(clickedItem.unitId);
                setIsDragging(true);
                setDragStart({ x, y });
                setDragItemStartPos({ x: clickedItem.position.x, y: clickedItem.position.z });
            } else {
                setSelectedUnitId(null);
            }
        } else if (drawMode === 'text') {
            const text = prompt("Enter label text:", "Unlabeled Area");
            if (text) {
                const id = 'text_' + Date.now();
                addOrUpdateMarker({
                    unitId: id,
                    unitCode: text,
                    type: 'cabin', // Treat as item for simplicity but maybe add custom type in future
                    x,
                    y,
                    width: 0.5 * scale, // small marker
                    height: 0.5 * scale,
                    color: '#333333'
                });
                // Hack: Add id to units list locally if needed? No, layout accepts items without units list match technically but UI filters?
                // For now, let's just add it to layout directly.
            }
        } else {
            handleCanvasClick(e);
        }
    };

    // Local Layout for smooth dragging
    const [localLayout, setLocalLayout] = useState(layout);

    useEffect(() => {
        if (!isDragging) {
            setLocalLayout(layout);
        }
    }, [layout, isDragging]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !dragStart || !selectedUnitId) return;
        if (!imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Delta in pixels
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;

        // Delta in world space
        // Apply a small smoothing factor (0.95 or similar) if needed, but usually 1:1 is best once lag is gone
        const dwX = dx / scale;
        const dwZ = dy / scale;

        if (draggingCornerIndex !== null) {
            // Dragging a polygon/corner point
            const updatedLayout = localLayout.map(item => {
                if (item.unitId === selectedUnitId && item.metadata?.polyPoints) {
                    const newPoints = [...item.metadata.polyPoints];
                    const originalPoint = newPoints[draggingCornerIndex];

                    newPoints[draggingCornerIndex] = {
                        x: originalPoint.x + dwX,
                        z: originalPoint.z + dwZ
                    };

                    // Recalculate centroid for position
                    const newCentroidX = newPoints.reduce((sum: number, p: any) => sum + p.x, 0) / newPoints.length;
                    const newCentroidZ = newPoints.reduce((sum: number, p: any) => sum + p.z, 0) / newPoints.length;

                    return {
                        ...item,
                        position: { x: newCentroidX, y: 0.5, z: newCentroidZ },
                        metadata: { ...item.metadata, polyPoints: newPoints }
                    };
                }
                return item;
            });
            setLocalLayout(updatedLayout);
            onLayoutChange(updatedLayout); // Keep parent in sync but locally updated first
            setDragStart({ x, y });
        } else if (dragItemStartPos) {
            // Dragging entire item
            const newX = dragItemStartPos.x + dwX;
            const newZ = dragItemStartPos.y + dwZ;

            const updatedLayout = localLayout.map(item => {
                if (item.unitId === selectedUnitId) {
                    const metadata = { ...item.metadata };
                    if (metadata.polyPoints) {
                        metadata.polyPoints = metadata.polyPoints.map((p: any) => ({
                            x: p.x + dwX,
                            z: p.z + dwZ
                        }));
                    }
                    return { ...item, position: { ...item.position, x: newX, z: newZ }, metadata };
                }
                return item;
            });

            setLocalLayout(updatedLayout);
            onLayoutChange(updatedLayout);
            // Updating dragStart here because we need it for the next dx calculation
            // since we are using relative movement for polyPoints but absolute for position?
            // Wait, if we use newX = startPos + totalDelta, we shouldn't update dragStart.
            // But polyPoints move relatively (p.x + dwX).
            // Let's make it consistent: update dragStart and move everything relatively.
            setDragStart({ x, y });
            setDragItemStartPos({ x: newX, y: newZ });
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setDraggingCornerIndex(null);
            setDragStart(null);
            setDragItemStartPos(null);
            addToHistory(localLayout); // Commit the Drag with final local state
        }
    };
    // Legacy Click wrapper for new modes (handled in MouseDown mostly now for Pointer)
    const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
        if (drawMode === 'pointer') return; // Handled in Down
        if (!imageUrl || !imgRef.current) return;
        if (drawMode !== 'poly' && !selectedUnitId && drawMode !== 'text') return; // Need selection for point/rect

        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (drawMode === 'point' || drawMode === 'rect') {
            const unit = units.find(u => u.id === selectedUnitId);
            const scenario = SCENARIO_TYPES.find(s => s.id === selectedUnitId);

            if (unit || scenario) {
                addOrUpdateMarker({
                    unitId: unit?.id || (selectedUnitId + '_' + Date.now()),
                    unitCode: unit?.unitCode || scenario?.name || 'Item',
                    type: scenario ? (scenario.id as any) : (drawMode === 'point' ? 'seat' : 'cabin'),
                    x,
                    y,
                    width: drawMode === 'rect' ? 80 : (scenario?.id === 'road' ? 120 : undefined),
                    height: drawMode === 'rect' ? 80 : (scenario?.id === 'road' ? 40 : undefined),
                    color: scenario?.color || (drawMode === 'point' ? '#7cff4d' : '#ffa500')
                });
            }
        } else if (drawMode === 'poly') {
            setTempPolyPoints([...tempPolyPoints, { x, y }]);
        }
    };

    // ... (keep finishPoly)
    const finishPoly = () => {
        if (!selectedUnitId || tempPolyPoints.length < 3) return;
        const unit = units.find(u => u.id === selectedUnitId);
        const scenario = SCENARIO_TYPES.find(s => s.id === selectedUnitId);

        const centroidX = tempPolyPoints.reduce((sum, p) => sum + p.x, 0) / tempPolyPoints.length;
        const centroidY = tempPolyPoints.reduce((sum, p) => sum + p.y, 0) / tempPolyPoints.length;

        // Convert all points to world space
        const worldPoints = tempPolyPoints.map(p => {
            const world = getWorld(p.x, p.y);
            return { x: world.x, z: world.z };
        });

        addOrUpdateMarker({
            unitId: unit?.id || (selectedUnitId + '_' + Date.now()),
            unitCode: unit?.unitCode || scenario?.name || 'Polygon',
            type: scenario ? (scenario.id as any) : 'flat',
            x: centroidX,
            y: centroidY,
            points: worldPoints as any,
            color: scenario?.color || '#00d2ff'
        });
        setTempPolyPoints([]);
    };

    // ... (keep addOrUpdateMarker)
    const addOrUpdateMarker = (marker: Marker) => {
        if (!imgRef.current) return;

        const centerX = imgRef.current.width / 2;
        const centerY = imgRef.current.height / 2;

        const worldX = (marker.x - centerX) / scale;
        const worldZ = (marker.y - centerY) / scale;

        // If it's a rect/point and we want corner adjustment, it should ideally use polyPoints too
        let polyPoints = marker.points;
        if (!polyPoints && marker.width && marker.height) {
            // Generate 4 corners for rect
            const w2 = (marker.width / scale) / 2;
            const h2 = (marker.height / scale) / 2;
            polyPoints = [
                { x: worldX - w2, z: worldZ - h2 },
                { x: worldX + w2, z: worldZ - h2 },
                { x: worldX + w2, z: worldZ + h2 },
                { x: worldX - w2, z: worldZ + h2 },
            ] as any;
        }

        const newItem = {
            unitId: marker.unitId,
            unitCode: marker.unitCode,
            type: marker.type,
            position: { x: worldX, y: 0.5, z: worldZ },
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: marker.width ? { w: marker.width / scale, h: 1, d: marker.height! / scale } : { w: 1, h: 1, d: 1 },
            color: marker.color,
            metadata: {
                polyPoints: polyPoints
            }
        };

        const existingIndex = layout.findIndex(l => l.unitId === marker.unitId);
        let newLayout = [...layout];
        if (existingIndex >= 0) {
            newLayout[existingIndex] = newItem;
        } else {
            newLayout.push(newItem);
        }

        addToHistory(newLayout);
    };

    // Property Editing Handler
    const handlePropertyChange = (field: string, value: any) => {
        if (!selectedUnitId) return;
        const updatedLayout = localLayout.map(item => {
            if (item.unitId === selectedUnitId) {
                if (field === 'width') {
                    return { ...item, dimensions: { ...item.dimensions, w: Number(value) } };
                }
                if (field === 'depth') {
                    return { ...item, dimensions: { ...item.dimensions, d: Number(value) } };
                }
                if (field === 'rotation') {
                    return { ...item, rotation: { ...item.rotation, y: Number(value) } };
                }
            }
            return item;
        });
        setLocalLayout(updatedLayout);
        addToHistory(updatedLayout);
    };

    const handleDelete = () => {
        if (!selectedUnitId) return;
        if (confirm("Delete this item?")) {
            const newLayout = localLayout.filter(l => l.unitId !== selectedUnitId);
            setLocalLayout(newLayout);
            addToHistory(newLayout);
            setSelectedUnitId(null);
        }
    };

    // Get Selected Item Dimensions for UI
    const selectedItem = localLayout.find(l => l.unitId === selectedUnitId);


    return (
        <div className="row h-100 relative">
            {/* Toolbar / Sidebar */}
            {!previewMode && (
                <div className="col-md-3 border-end bg-light p-0 d-flex flex-column" style={{ minHeight: '700px' }}>
                    <div className="p-3 border-bottom bg-white">
                        <div className="d-flex justify-content-between mb-3">
                            <h6 className="fw-bold mb-0">Tools</h6>
                            <div className="btn-group">
                                <button className="btn btn-sm btn-outline-secondary" onClick={handleUndo} disabled={historyStep <= 0}><i className="bi bi-arrow-counterclockwise"></i></button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={handleRedo} disabled={historyStep >= history.length - 1}><i className="bi bi-arrow-clockwise"></i></button>
                            </div>
                        </div>

                        <div className="btn-group w-100 mb-3" role="group">
                            <button type="button" className={`btn btn-sm ${drawMode === 'pointer' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('pointer')} title="Select / Move"><i className="bi bi-cursor-fill"></i></button>
                            <button type="button" className={`btn btn-sm ${drawMode === 'point' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('point')} title="Point"><i className="bi bi-geo-alt-fill"></i></button>
                            <button type="button" className={`btn btn-sm ${drawMode === 'rect' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('rect')} title="Rect"><i className="bi bi-square"></i></button>
                            <button type="button" className={`btn btn-sm ${drawMode === 'poly' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('poly')} title="Poly"><i className="bi bi-pentagon"></i></button>
                            <button type="button" className={`btn btn-sm ${drawMode === 'text' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('text')} title="Label"><i className="bi bi-fonts"></i></button>
                        </div>

                        {selectedItem && (
                            <div className="card mb-3 bg-light border-0">
                                <div className="card-body p-2 small">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <strong>{selectedItem.unitCode}</strong>
                                        <button className="btn btn-xs btn-outline-danger py-0" onClick={handleDelete}><i className="bi bi-trash"></i></button>
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="form-label extra-small mb-0">Width (m)</label>
                                            <input type="number" step="0.1" className="form-control form-control-sm py-0" value={selectedItem.dimensions?.w || 1} onChange={(e) => handlePropertyChange('width', e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label extra-small mb-0">Depth (m)</label>
                                            <input type="number" step="0.1" className="form-control form-control-sm py-0" value={selectedItem.dimensions?.d || 1} onChange={(e) => handlePropertyChange('depth', e.target.value)} />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label extra-small mb-0">Rotation (deg)</label>
                                            <input type="range" className="form-range" min="0" max="360" value={selectedItem.rotation?.y || 0} onChange={(e) => handlePropertyChange('rotation', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-2">
                            <label className="form-label small fw-bold">Scale (px/m)</label>
                            <input type="number" className="form-control form-control-sm" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                        </div>

                        <div className="d-flex gap-2 mb-2">
                            <button className="btn btn-outline-info btn-sm w-100" onClick={() => setPreviewMode(true)}>
                                <i className="bi bi-eye me-2"></i> Preview
                            </button>
                            <button className="btn btn-outline-dark btn-sm w-100" onClick={() => setShowJson(true)}>
                                <i className="bi bi-code-slash me-2"></i> JSON
                            </button>
                        </div>

                        <label className="btn btn-outline-primary btn-sm w-100">
                            Upload Plan <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                        </label>
                    </div>
                    {/* List Group Area */}
                    <div className="p-3 flex-grow-1 overflow-auto">
                        <h6 className="fw-bold mb-2 small text-muted text-uppercase">Environment Scenario</h6>
                        <div className="row g-2 mb-4">
                            {SCENARIO_TYPES.map(s => (
                                <div className="col-4" key={s.id}>
                                    <button
                                        className={`btn btn-xs w-100 d-flex flex-column align-items-center justify-content-center p-2 rounded-3 border ${selectedUnitId === s.id ? 'btn-primary border-primary' : 'btn-white'}`}
                                        onClick={() => { setSelectedUnitId(s.id); setDrawMode(s.id === 'road' || s.id === 'river' ? 'poly' : 'point'); }}
                                        title={s.name}
                                    >
                                        <i className={`bi ${s.icon} mb-1 fs-6`}></i>
                                        <span style={{ fontSize: '9px' }}>{s.name}</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <h6 className="fw-bold mb-2 small text-muted text-uppercase">Unassigned Units</h6>
                        <div className="list-group">
                            {units.map(unit => {
                                const isPlaced = layout.some(l => l.unitId === unit.id);
                                return (
                                    <button
                                        key={unit.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex justify-content-between align-items-center ${selectedUnitId === unit.id ? 'active' : 'bg-white'}`}
                                        onClick={() => { setSelectedUnitId(unit.id); setDrawMode(drawMode === 'rect' ? 'rect' : 'point'); }}
                                    >
                                        <div className="text-truncate" style={{ maxWidth: '120px' }}><small>{unit.unitCode}</small></div>
                                        {isPlaced && <i className="bi bi-check-circle-fill text-success small"></i>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div className={`${previewMode ? 'col-12' : 'col-md-9'} bg-secondary bg-opacity-10 p-4 d-flex align-items-center justify-content-center overflow-auto position-relative`} style={{ minHeight: '600px' }}>
                {previewMode && <button className="btn btn-light position-absolute top-0 end-0 m-3 shadow-sm z-3" onClick={() => setPreviewMode(false)}>Exit Preview</button>}
                {!imageUrl ? (
                    <div className="text-center text-muted"><h4>No Floor Plan</h4><p>Upload an image to start.</p></div>
                ) : (
                    <div
                        ref={containerRef}
                        className="position-relative shadow-sm bg-white"
                        style={{ cursor: drawMode === 'pointer' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair', display: 'inline-block' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Image */}
                        <img ref={imgRef} src={imageUrl} alt="Plan" style={{ pointerEvents: 'none', display: 'block', maxWidth: '100%' }} />

                        {/* SVG Overlay */}
                        <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none' }}>
                            {localLayout.map((item, idx) => {
                                const px = getPixel({ x: item.position.x, z: item.position.z });
                                const w = (item.dimensions?.w || 1) * scale;
                                const h = (item.dimensions?.d || 1) * scale;
                                const isSelected = selectedUnitId === item.unitId;

                                return (
                                    <g key={idx} transform={item.metadata?.polyPoints ? "" : `rotate(${item.rotation?.y || 0}, ${px.x}, ${px.y})`} style={{ transition: isDragging ? 'none' : 'all 0.1s' }}>
                                        {item.metadata?.polyPoints ? (
                                            <polygon
                                                points={item.metadata.polyPoints.map((p: any) => {
                                                    const pp = getPixel({ x: p.x, z: p.z });
                                                    return `${pp.x},${pp.y}`;
                                                }).join(' ')}
                                                fill={item.color || '#00d2ff'}
                                                fillOpacity="0.4"
                                                stroke={isSelected ? '#ff4d4d' : (item.color || '#333')}
                                                strokeWidth={isSelected ? 3 : 1.5}
                                            />
                                        ) : (
                                            item.dimensions?.w > 1.5 || item.type === 'cabin' ? (
                                                <rect
                                                    x={px.x - w / 2} y={px.y - h / 2} width={w} height={h}
                                                    fill={item.color || 'orange'} fillOpacity="0.5"
                                                    stroke={isSelected ? 'red' : 'black'} strokeWidth={isSelected ? 2 : 1}
                                                />
                                            ) : (
                                                <circle cx={px.x} cy={px.y} r="6" fill={item.color || 'green'} stroke={isSelected ? 'red' : 'white'} strokeWidth={isSelected ? 2 : 2} />
                                            )
                                        )}
                                        <text x={px.x} y={px.y} dy=".3em" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold" style={{ textShadow: '0 0 2px white', pointerEvents: 'none' }}>
                                            {item.unitCode}
                                        </text>

                                        {/* Corner Handles for selected item */}
                                        {isSelected && item.metadata?.polyPoints && item.metadata.polyPoints.map((p: any, pIdx: number) => {
                                            const pp = getPixel({ x: p.x, z: p.z });
                                            return (
                                                <circle
                                                    key={pIdx} cx={pp.x} cy={pp.y} r="5"
                                                    fill="white" stroke="#ff4d4d" strokeWidth="2"
                                                    style={{ cursor: 'move', pointerEvents: 'auto' }}
                                                />
                                            );
                                        })}
                                    </g>
                                );
                            })}
                            {/* Temp Poly Render ... */}
                            {drawMode === 'poly' && tempPolyPoints.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r="4" fill="red" />
                            ))}
                            {drawMode === 'poly' && tempPolyPoints.length > 1 && (
                                <polyline
                                    points={tempPolyPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill="none" stroke="red" strokeDasharray="4"
                                />
                            )}
                        </svg>
                        {/* Poly Finish Button */}
                        {drawMode === 'poly' && tempPolyPoints.length >= 3 && (
                            <button
                                className="btn btn-sm btn-success position-absolute"
                                style={{ top: tempPolyPoints[tempPolyPoints.length - 1].y + 10, left: tempPolyPoints[tempPolyPoints.length - 1].x + 10, pointerEvents: 'auto' }}
                                onClick={(e) => { e.stopPropagation(); finishPoly(); }}
                            >
                                Finish
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showJson && (
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
                    <div className="card shadow-lg w-50" style={{ maxHeight: '80vh' }}>
                        <div className="card-header d-flex justify-content-between"><h6 className="mb-0">JSON</h6><button className="btn-close" onClick={() => setShowJson(false)}></button></div>
                        <div className="card-body p-0"><textarea className="form-control border-0 font-monospace small" style={{ height: '400px' }} readOnly value={JSON.stringify(layout, null, 2)}></textarea></div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .extra-small { font-size: 10px; }
            `}</style>
        </div>
    );
}
