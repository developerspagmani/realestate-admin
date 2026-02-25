'use client';

import { useState, useRef, useEffect, MouseEvent, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { DEMO_HOUSE_PLANS } from '@/app/constants/demoPlans';
import Loader from '@/components/common/Loader';

interface Marker {
    unitId: string;
    unitCode: string;
    type: 'seat' | 'cabin' | 'flat' | 'villa' | 'road' | 'tree' | 'drainage' | 'hills' | 'river' | 'lake' | 'garden' | 'park' | 'pond' | 'court' | 'clubhouse' | 'arch';
    x: number; // pixel x
    y: number; // pixel y
    width?: number; // for rect
    height?: number; // for rect
    points?: { x: number; y: number }[]; // for polygon
    color?: string;
}

const SCENARIO_TYPES = [
    { id: 'road', name: 'Road/Path', color: '#555555', icon: 'bi-signpost-split' },
    { id: 'tree', name: 'Tree/Plant', color: '#2d572c', icon: 'bi-tree-fill' },
    { id: 'garden', name: 'Garden/Greenery', color: '#81c784', icon: 'bi-flower1' },
    { id: 'park', name: 'Sculpture/Activity Park', color: '#4caf50', icon: 'bi-emoji-smile' },
    { id: 'pond', name: 'Lily Pond/Water', color: '#4fc3f7', icon: 'bi-water' },
    { id: 'court', name: 'Sports Court', color: '#64b5f6', icon: 'bi-grid-3x3-gap' },
    { id: 'clubhouse', name: 'Clubhouse/Amenity', color: '#9575cd', icon: 'bi-house-heart' },
    { id: 'arch', name: 'Entrance Arch', color: '#a1887f', icon: 'bi-door-open-fill' },
    { id: 'hills', name: 'Hills/Terrain', color: '#8d6e63', icon: 'bi-mountain' },
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
    const [localLayout, setLocalLayout] = useState<any[]>(layout || []);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [drawMode, setDrawMode] = useState<'pointer' | 'hand' | 'point' | 'rect' | 'poly' | 'text' | 'frame'>('pointer');
    const [tempPolyPoints, setTempPolyPoints] = useState<{ x: number, y: number }[]>([]);

    console.log('VisualEditor: Rendering with units:', units?.length, 'layout:', localLayout?.length);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const [draggingType, setDraggingType] = useState<'move' | 'rotate' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'poly-corner' | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [dragItemStartPos, setDragItemStartPos] = useState<{ x: number, y: number } | null>(null);
    const [dragItemStartRotation, setDragItemStartRotation] = useState<number>(0);
    const [dragItemStartDimensions, setDragItemStartDimensions] = useState<{ w: number, d: number }>({ w: 0, d: 0 });
    const [draggingCornerIndex, setDraggingCornerIndex] = useState<number | null>(null);
    const [isCreatingRect, setIsCreatingRect] = useState(false);
    const [rectStart, setRectStart] = useState<{ x: number, y: number } | null>(null);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    // New Features State
    const [showJson, setShowJson] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [leftSidebarTab, setLeftSidebarTab] = useState<'units' | 'layers'>('units');
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
    const [canvasLocked, setCanvasLocked] = useState(false);
    const [isExtractingSvg, setIsExtractingSvg] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);

    // Helpers
    const isPointInPoly = (point: { x: number, z: number }, vs: { x: number, z: number }[]) => {
        let x = point.x, y = point.z;
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i].x, yi = vs[i].z;
            let xj = vs[j].x, yj = vs[j].z;
            let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // History management
    const [history, setHistory] = useState<any[][]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // History and Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedUnitId && (e.key === 'Delete' || e.key === 'Backspace')) {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    const newLayout = localLayout.filter(l => l.unitId !== selectedUnitId);
                    addToHistory(newLayout);
                    setSelectedUnitId(null);
                }
            }
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
            if (e.key === ' ') {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setIsSpacePressed(true);
                }
            }
            if (e.key === 'p' || e.key === 'v') setDrawMode('pointer');
            if (e.key === 'h') setDrawMode('hand');
            if (e.key === 'r') setDrawMode('rect');
            if (e.key === 'l') setDrawMode('poly');
            if (e.key === 't') setDrawMode('text');

            if (drawMode === 'poly') {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    setTempPolyPoints(prev => prev.slice(0, -1));
                }
                if (e.key === 'Escape') {
                    setTempPolyPoints([]);
                    setDrawMode('pointer');
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedUnitId, localLayout, historyStep, drawMode]);

    // Update local layout when prop changes (e.g. on load)
    useEffect(() => {
        if (layout && layout.length > 0 && localLayout.length === 0) {
            setLocalLayout(layout);
        }
    }, [layout]);

    // ... (keep useEffect for history Init) 
    useEffect(() => {
        if (history.length === 0 && (layout?.length > 0 || localLayout.length > 0)) {
            const initial = localLayout.length > 0 ? localLayout : layout;
            setHistory([initial]);
            setHistoryStep(0);
        }
    }, [layout, history.length]);

    // ... (keep addToHistory, handleUndo, handleRedo)
    const addToHistory = (newLayout: any[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newLayout);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setLocalLayout(newLayout);
        onLayoutChange(newLayout);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            setLocalLayout(history[prevStep]);
            onLayoutChange(history[prevStep]);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setLocalLayout(history[nextStep]);
            onLayoutChange(history[nextStep]);
        }
    };

    // Config state
    // Designer Canvas state
    const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
    const imgRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<any>(null);

    const [snapToGrid, setSnapToGrid] = useState(false);
    const gridSize = 10; // 10 pixels for snapping

    const [imageUrl, setImageUrl] = useState<string | null>(config?.scene?.floorPlan || null);

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerSvgImport = () => {
        fileInputRef.current?.click();
    };

    const handleSvgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        handleSvgScan(text);
    };

    // Helper to get pixel from world
    const getPixel = useCallback((pos: { x: number, z: number }) => {
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;
        return {
            x: (pos.x * scale) + centerX,
            y: (pos.z * scale) + centerY
        };
    }, [scale]);

    // Helper to get world from pixel
    const getWorld = useCallback((px: number, py: number) => {
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;
        return {
            x: (px - centerX) / scale,
            z: (py - centerY) / scale
        };
    }, [scale]);

    // Helper to get handle position for a marker
    const getHandlePos = useCallback((item: any, type: 'tl' | 'tr' | 'bl' | 'br' | 'rotate') => {
        const px = getPixel({ x: item.position.x, z: item.position.z });
        const w = (item.dimensions?.w || 1) * scale;
        const h = (item.dimensions?.d || 1) * scale;
        const rot = (item.rotation?.y || 0) * (Math.PI / 180);

        let localX = 0, localY = 0;
        switch (type) {
            case 'tl': localX = -w / 2; localY = -h / 2; break;
            case 'tr': localX = w / 2; localY = -h / 2; break;
            case 'bl': localX = -w / 2; localY = h / 2; break;
            case 'br': localX = w / 2; localY = h / 2; break;
            case 'rotate': localX = 0; localY = -h / 2 - 30; break;
        }

        const rotatedX = localX * Math.cos(rot) - localY * Math.sin(rot);
        const rotatedY = localX * Math.sin(rot) + localY * Math.cos(rot);

        return { x: px.x + rotatedX, y: px.y + rotatedY };
    }, [getPixel, scale]);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentScale = transformRef.current?.state?.scale || 1;

        // Correct for zoom
        let x = (e.clientX - rect.left) / currentScale;
        let y = (e.clientY - rect.top) / currentScale;

        // Snapping
        if (snapToGrid) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        if (e.button === 1) { // Middle click always allows panning
            setIsMiddleMouseDown(true);
            return;
        }

        if (drawMode === 'hand' || isSpacePressed) return;

        if (drawMode === 'pointer') {
            // Check for handles first on selected item
            if (selectedUnitId) {
                const item = localLayout.find(l => l.unitId === selectedUnitId);
                if (item) {
                    if (item.metadata?.polyPoints) {
                        const handles = item.metadata.polyPoints;
                        const handleIndex = handles.findIndex((p: any) => {
                            const px = getPixel({ x: p.x, z: p.z });
                            return Math.abs(x - px.x) < 10 && Math.abs(y - px.y) < 10;
                        });
                        if (handleIndex !== -1) {
                            setDraggingCornerIndex(handleIndex);
                            setDraggingType('poly-corner');
                            setIsDragging(true);
                            setDragStart({ x, y });
                            return;
                        }
                    } else {
                        // Check rect handles
                        const types: ('tl' | 'tr' | 'bl' | 'br' | 'rotate')[] = ['tl', 'tr', 'bl', 'br', 'rotate'];
                        for (const type of types) {
                            const pos = getHandlePos(item, type);
                            if (Math.abs(x - pos.x) < 12 && Math.abs(y - pos.y) < 12) {
                                setDraggingType(type === 'rotate' ? 'rotate' : `resize-${type}` as any);
                                setIsDragging(true);
                                setDragStart({ x, y });
                                setDragItemStartPos({ x: item.position.x, y: item.position.z });
                                setDragItemStartRotation(item.rotation?.y || 0);
                                setDragItemStartDimensions({ w: item.dimensions?.w || 1, d: item.dimensions?.d || 1 });
                                return;
                            }
                        }
                    }
                }
            }

            // Find item clicked (to move or select)
            const clickedItem = localLayout.slice().reverse().find(item => {
                const worldClick = getWorld(x, y);
                if (item.metadata?.polyPoints) {
                    return isPointInPoly({ x: worldClick.x, z: worldClick.z }, item.metadata.polyPoints);
                }

                const px = getPixel({ x: item.position.x, z: item.position.z });
                const w = (item.dimensions?.w || 1) * scale;
                const h = (item.dimensions?.d || 1) * scale;
                const rot = (item.rotation?.y || 0) * (Math.PI / 180);

                const dx = x - px.x;
                const dy = y - px.y;
                const localX = dx * Math.cos(-rot) - dy * Math.sin(-rot);
                const localY = dx * Math.sin(-rot) + dy * Math.cos(-rot);

                return Math.abs(localX) < (w / 2 + 15) && Math.abs(localY) < (h / 2 + 15);
            });

            if (clickedItem) {
                setSelectedUnitId(clickedItem.unitId);
                setIsDragging(true);
                setDraggingType('move');
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
        } else if (drawMode === 'rect' || drawMode === 'frame') {
            setIsCreatingRect(true);
            setRectStart({ x, y });
            setDragStart({ x, y });
        } else {
            handleCanvasClick(e);
        }
    };



    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentScale = transformRef.current?.state?.scale || 1;

        let x = (e.clientX - rect.left) / currentScale;
        let y = (e.clientY - rect.top) / currentScale;

        if (snapToGrid) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        const worldPos = getWorld(x, y);
        setCursorPos({ x, y });

        if (drawMode === 'poly') {
            // Already handled by setCursorPos above
        }

        if (!isDragging && drawMode === 'pointer') {
            const worldPos = getWorld(x, y);
            const found = localLayout.slice().reverse().find(item => {
                if (item.metadata?.polyPoints) {
                    return isPointInPoly({ x: worldPos.x, z: worldPos.z }, item.metadata.polyPoints);
                }
                const px = getPixel({ x: item.position.x, z: item.position.z });
                const w = (item.dimensions?.w || 1) * scale;
                const h = (item.dimensions?.d || 1) * scale;
                const rot = (item.rotation?.y || 0) * (Math.PI / 180);
                const dxFromCenter = x - px.x;
                const dyFromCenter = y - px.y;
                const lx = dxFromCenter * Math.cos(-rot) - dyFromCenter * Math.sin(-rot);
                const ly = dxFromCenter * Math.sin(-rot) + dyFromCenter * Math.cos(-rot);
                return Math.abs(lx) < (w / 2 + 5) && Math.abs(ly) < (h / 2 + 5);
            });
            setHoveredUnitId(found?.unitId || null);
        } else {
            setHoveredUnitId(null);
        }

        // 2. Handle Dragging Interaction
        if (!isDragging || !dragStart || !selectedUnitId) return;

        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        const dwX = dx / scale;
        const dwZ = dy / scale;

        if (draggingType === 'poly-corner' && draggingCornerIndex !== null) {
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
            onLayoutChange(updatedLayout);
            setDragStart({ x, y });
        } else if (draggingType === 'rotate') {
            const item = localLayout.find(l => l.unitId === selectedUnitId);
            if (item) {
                const px = getPixel({ x: item.position.x, z: item.position.z });
                // Calculate angle: 0 degrees is UP (-Y direction in SVG)
                const angle = Math.atan2(y - px.y, x - px.x) * (180 / Math.PI) + 90;

                const updatedLayout = localLayout.map(i =>
                    i.unitId === selectedUnitId ? { ...i, rotation: { ...i.rotation, y: angle } } : i
                );
                setLocalLayout(updatedLayout);
                onLayoutChange(updatedLayout);
            }
        } else if (draggingType?.startsWith('resize')) {
            const item = localLayout.find(l => l.unitId === selectedUnitId);
            if (item && dragItemStartPos && dragItemStartDimensions) {
                const px = getPixel({ x: dragItemStartPos.x, z: dragItemStartPos.y });
                const rot = (dragItemStartRotation || 0) * (Math.PI / 180);

                // Mouse position in local coordinates (unrotated)
                const dxFromCenter = x - px.x;
                const dyFromCenter = y - px.y;
                const localX = dxFromCenter * Math.cos(-rot) - dyFromCenter * Math.sin(-rot);
                const localY = dxFromCenter * Math.sin(-rot) + dyFromCenter * Math.cos(-rot);

                let newW = dragItemStartDimensions.w;
                let newD = dragItemStartDimensions.d;

                // Simple Resize from Center logic
                if (draggingType.includes('tr')) {
                    newW = (localX * 2) / scale;
                    newD = (-localY * 2) / scale;
                } else if (draggingType.includes('br')) {
                    newW = (localX * 2) / scale;
                    newD = (localY * 2) / scale;
                } else if (draggingType.includes('bl')) {
                    newW = (-localX * 2) / scale;
                    newD = (localY * 2) / scale;
                } else if (draggingType.includes('tl')) {
                    newW = (-localX * 2) / scale;
                    newD = (-localY * 2) / scale;
                }

                const updatedLayout = localLayout.map(i =>
                    i.unitId === selectedUnitId ? {
                        ...i,
                        dimensions: { ...i.dimensions, w: Math.abs(newW), d: Math.abs(newD) }
                    } : i
                );
                setLocalLayout(updatedLayout);
                onLayoutChange(updatedLayout);
            }
        } else if (draggingType === 'move' && dragItemStartPos) {
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
            setDragStart({ x, y });
            setDragItemStartPos({ x: newX, y: newZ });
        } else if (isCreatingRect && rectStart) {
            setDragStart({ x, y });
        }

        if (drawMode === 'poly') {
            setCursorPos({ x, y });
        } else {
            setCursorPos(null);
        }
    };


    const handleDuplicate = () => {
        if (!selectedUnitId) return;
        const item = localLayout.find(l => l.unitId === selectedUnitId);
        if (item) {
            const newId = `${item.unitId}_copy_${Date.now()}`;
            const newItem = {
                ...item,
                unitId: newId,
                unitCode: `${item.unitCode} (Copy)`,
                position: { ...item.position, x: item.position.x + 0.5, z: item.position.z + 0.5 }
            };
            const newLayout = [...localLayout, newItem];
            setLocalLayout(newLayout);
            addToHistory(newLayout);
            setSelectedUnitId(newId);
        }
    };

    const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            setIsDragging(false);
            setDraggingType(null);
            setDraggingCornerIndex(null);
            setDragStart(null);
            setDragItemStartPos(null);
            setDragItemStartRotation(0);
            setDragItemStartDimensions({ w: 0, d: 0 });
            // Remove the auto-history here to avoid double-history on simple clicks if move didn't happen?
            // Actually move already calls it in mouse move? No, only on stop.
            addToHistory(localLayout);
        } else if (isCreatingRect && rectStart && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const currentScale = transformRef.current?.state?.scale || 1;
            let x = (e.clientX - rect.left) / currentScale;
            let y = (e.clientY - rect.top) / currentScale;

            if (snapToGrid) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }

            const width = Math.abs(x - rectStart.x);
            const height = Math.abs(y - rectStart.y);
            const centerX = (x + rectStart.x) / 2;
            const centerY = (y + rectStart.y) / 2;

            if (width > 5 && height > 5) {
                createBoxAt(centerX, centerY, width, height);
            } else {
                // Clicked without dragging - create at default size
                const defaultSize = drawMode === 'frame' ? 400 : 150;
                createBoxAt(x, y, defaultSize, defaultSize);
            }
            setIsCreatingRect(false);
            setRectStart(null);
        }
    };

    const createBoxAt = (centerX: number, centerY: number, width: number, height: number) => {
        const unit = units.find(u => u.id === selectedUnitId);
        const scenario = SCENARIO_TYPES.find(s => s.id === selectedUnitId);
        const isAlreadyPlaced = localLayout.some(l => l.unitId === selectedUnitId);

        const newId = (drawMode === 'frame' || isAlreadyPlaced || !selectedUnitId) ? `${drawMode === 'frame' ? 'frame' : 'shape'}_${Date.now()}` : (unit?.id || scenario?.id || `shape_${Date.now()}`);
        const newCode = (drawMode === 'frame' || isAlreadyPlaced || !selectedUnitId) ? (drawMode === 'frame' ? 'New Frame' : 'Unassigned Shape') : (unit?.unitCode || scenario?.name || 'Unassigned Shape');

        addOrUpdateMarker({
            unitId: newId as string,
            unitCode: newCode,
            type: drawMode === 'frame' ? 'flat' : (scenario ? (scenario.id as any) : 'cabin'),
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            color: drawMode === 'frame' ? '#f8f9fa' : (scenario?.color || '#3182ce')
        });
        setSelectedUnitId(newId as string);
    };
    // Legacy Click wrapper for new modes (handled in MouseDown mostly now for Pointer)
    const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
        if (drawMode === 'pointer') return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const currentScale = transformRef.current?.state?.scale || 1;
        let x = (e.clientX - rect.left) / currentScale;
        let y = (e.clientY - rect.top) / currentScale;

        if (snapToGrid) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        if (drawMode === 'point' || drawMode === 'rect') {
            const unit = units.find(u => u.id === selectedUnitId);
            const scenario = SCENARIO_TYPES.find(s => s.id === selectedUnitId);

            const newId = unit?.id || scenario?.id || `shape_${Date.now()}`;
            const newCode = unit?.unitCode || scenario?.name || 'Unassigned Shape';

            const defaultSize = drawMode === 'rect' ? 200 : 100;
            addOrUpdateMarker({
                unitId: newId as string,
                unitCode: newCode,
                type: scenario ? (scenario.id as any) : (drawMode === 'point' ? 'seat' : 'cabin'),
                x,
                y,
                width: drawMode === 'rect' ? defaultSize : (scenario?.id === 'road' ? 120 : undefined),
                height: drawMode === 'rect' ? defaultSize : (scenario?.id === 'road' ? 40 : undefined),
                color: scenario?.color || (drawMode === 'point' ? '#7cff4d' : '#3182ce')
            });
            setSelectedUnitId(newId as string);
        } else if (drawMode === 'poly') {
            if (tempPolyPoints.length > 2) {
                const first = tempPolyPoints[0];
                const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
                if (dist < 15) {
                    finishPoly();
                    return;
                }
            }
            setTempPolyPoints([...tempPolyPoints, { x, y }]);
        }
    };

    // ... (keep finishPoly)
    const finishPoly = () => {
        if (tempPolyPoints.length < 3) return;
        const unit = units.find(u => u.id === selectedUnitId);
        const scenario = SCENARIO_TYPES.find(s => s.id === selectedUnitId);

        const newId = unit?.id || scenario?.id || `shape_${Date.now()}`;
        const newCode = unit?.unitCode || scenario?.name || 'Unassigned Plot';

        const centroidX = tempPolyPoints.reduce((sum, p) => sum + p.x, 0) / tempPolyPoints.length;
        const centroidY = tempPolyPoints.reduce((sum, p) => sum + p.y, 0) / tempPolyPoints.length;

        const worldPoints = tempPolyPoints.map(p => {
            const world = getWorld(p.x, p.y);
            return { x: world.x, z: world.z };
        });

        addOrUpdateMarker({
            unitId: newId as string,
            unitCode: newCode,
            type: scenario ? (scenario.id as any) : 'flat',
            x: centroidX,
            y: centroidY,
            points: worldPoints as any,
            color: scenario?.color || '#00d2ff'
        });
        setSelectedUnitId(newId as string);
        setTempPolyPoints([]);
    };

    // ... (keep addOrUpdateMarker)
    const addOrUpdateMarker = (marker: Marker) => {
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;

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

        const existingItem = localLayout.find(l => l.unitId === marker.unitId);

        const newItem = {
            unitId: marker.unitId,
            unitCode: marker.unitCode,
            type: marker.type,
            position: { x: worldX, y: 0.5, z: worldZ },
            rotation: existingItem ? existingItem.rotation : { x: 0, y: 0, z: 0 },
            dimensions: marker.width ? { w: marker.width / scale, h: 1, d: marker.height! / scale } : (existingItem ? existingItem.dimensions : { w: 1, h: 1, d: 1 }),
            color: marker.color,
            metadata: {
                polyPoints: polyPoints
            }
        };

        const existingIndex = localLayout.findIndex(l => l.unitId === marker.unitId);
        let newLayout = [...localLayout];
        if (existingIndex >= 0) {
            newLayout[existingIndex] = newItem;
        } else {
            newLayout.push(newItem);
        }

        addToHistory(newLayout);
    };

    const handleAssignUnit = (unitId: string) => {
        if (!selectedUnitId) return;
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const updatedLayout = localLayout.map(item => {
            if (item.unitId === selectedUnitId) {
                return { ...item, unitId: unit.id, unitCode: unit.unitCode };
            }
            // If the target unit was already assigned to another shape, unassign that shape or swap?
            // For Figma-like behavior, let's just swap or clear the old one.
            if (item.unitId === unit.id) {
                return { ...item, unitId: `shape_${Date.now()}_old`, unitCode: 'Unassigned Shape' };
            }
            return item;
        });

        setLocalLayout(updatedLayout);
        setSelectedUnitId(unit.id);
        addToHistory(updatedLayout);
    };

    const handleUnassign = () => {
        if (!selectedUnitId) return;
        const updatedLayout = localLayout.map(item => {
            if (item.unitId === selectedUnitId) {
                const newId = `shape_${Date.now()}`;
                return { ...item, unitId: newId, unitCode: 'Unassigned Shape' };
            }
            return item;
        });
        setLocalLayout(updatedLayout);
        setSelectedUnitId(null);
        addToHistory(updatedLayout);
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
                if (field === 'posX') {
                    return { ...item, position: { ...item.position, x: Number(value) } };
                }
                if (field === 'posZ') {
                    return { ...item, position: { ...item.position, z: Number(value) } };
                }
                if (field === 'preferredPlanId') {
                    return { ...item, metadata: { ...item.metadata, preferredPlanId: value } };
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

    const handlePolyPointChange = (idx: number, field: 'x' | 'z', value: number) => {
        if (!selectedUnitId) return;
        const updatedLayout = localLayout.map(item => {
            if (item.unitId === selectedUnitId && item.metadata?.polyPoints) {
                const newPoints = [...item.metadata.polyPoints];
                newPoints[idx] = { ...newPoints[idx], [field]: value };
                const cx = newPoints.reduce((sum, p) => sum + p.x, 0) / newPoints.length;
                const cz = newPoints.reduce((sum, p) => sum + p.z, 0) / newPoints.length;
                return { ...item, position: { ...item.position, x: cx, z: cz }, metadata: { ...item.metadata, polyPoints: newPoints } };
            }
            return item;
        });
        setLocalLayout(updatedLayout);
        addToHistory(updatedLayout);
    };

    const handleSvgScan = async (svgTextOverride?: string) => {
        setIsExtractingSvg(true);
        try {
            let svgText = svgTextOverride;
            if (!svgText && imageUrl && (imageUrl.toLowerCase().includes('image/svg+xml') || imageUrl.toLowerCase().endsWith('.svg'))) {
                // If it's a data URL, decode it, otherwise fetch it
                if (imageUrl.startsWith('data:image/svg+xml')) {
                    svgText = atob(imageUrl.split(',')[1]);
                } else {
                    const response = await fetch(imageUrl);
                    svgText = await response.text();
                }
            }

            if (!svgText) {
                alert("No SVG data found. Please upload an SVG first.");
                return;
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = doc.querySelector('svg');

            if (!svgElement) return;

            const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 1000, 1000];
            const vbW = viewBox[2];
            const vbH = viewBox[3];

            const newItems: any[] = [];

            // 1. Scan Rects
            const rects = doc.querySelectorAll('rect');
            rects.forEach((r, idx) => {
                const rx = parseFloat(r.getAttribute('x') || '0');
                const ry = parseFloat(r.getAttribute('y') || '0');
                const rw = parseFloat(r.getAttribute('width') || '0');
                const rh = parseFloat(r.getAttribute('height') || '0');

                // Convert SVG coords to World Scale
                // Map SVG viewBox to a centered 1000px area on the infinite canvas
                const offsetW = (canvasSize.width - 1000) / 2;
                const offsetH = (canvasSize.height - 1000) / 2;

                const imgX = (rx + rw / 2) * (1000 / vbW) + offsetW;
                const imgY = (ry + rh / 2) * (1000 / vbH) + offsetH;

                const world = getWorld(imgX, imgY);
                const id = `extracted_rect_${Date.now()}_${idx}`;

                const virtualW = rw * (1000 / vbW);
                const virtualH = rh * (1000 / vbH);

                newItems.push({
                    unitId: id, unitCode: `SVG Rect ${idx + 1}`, type: 'flat',
                    position: { x: world.x, y: 0.5, z: world.z },
                    rotation: { x: 0, y: 0, z: 0 },
                    dimensions: { w: virtualW / scale, h: 1, d: virtualH / scale },
                    color: '#00d2ff',
                });
            });

            // 2. Scan Polygons
            const polys = doc.querySelectorAll('polygon');
            polys.forEach((p, idx) => {
                const pointsStr = p.getAttribute('points') || "";
                const pairs = pointsStr.trim().split(/[\s,]+/).reduce((acc: any[], cur, i, arr) => {
                    if (i % 2 === 0) acc.push({ x: parseFloat(cur), y: parseFloat(arr[i + 1]) });
                    return acc;
                }, []);

                if (pairs.length < 3) return;

                const worldPoints = pairs.map(pt => {
                    const offsetW = (canvasSize.width - 1000) / 2;
                    const offsetH = (canvasSize.height - 1000) / 2;
                    const ix = pt.x * (1000 / vbW) + offsetW;
                    const iy = pt.y * (1000 / vbH) + offsetH;
                    return getWorld(ix, iy);
                });

                const cx = worldPoints.reduce((s, pt) => s + pt.x, 0) / worldPoints.length;
                const cz = worldPoints.reduce((s, pt) => s + pt.z, 0) / worldPoints.length;

                const id = `extracted_poly_${Date.now()}_${idx}`;
                newItems.push({
                    unitId: id, unitCode: `SVG Poly ${idx + 1}`, type: 'flat',
                    position: { x: cx, y: 0.5, z: cz },
                    rotation: { x: 0, y: 0, z: 0 },
                    dimensions: { w: 1, h: 1, d: 1 },
                    color: '#0cebeb',
                    metadata: { polyPoints: worldPoints }
                });
            });

            if (newItems.length === 0) {
                alert("No compatible shapes (rects/polygons) found in the SVG.");
            } else {
                const nextLayout = [...localLayout, ...newItems];
                setLocalLayout(nextLayout);
                addToHistory(nextLayout);
                alert(`Successfully extracted ${newItems.length} plots from SVG!`);
            }
        } catch (err) {
            console.error(err);
            alert("Error parsing SVG file.");
        } finally {
            setIsExtractingSvg(false);
        }
    };

    const handleImportCoordinates = () => {
        const raw = prompt("Paste coordinates (Format: x,y; x,y... or x y\\n x y):");
        if (!raw) return;
        try {
            const pairs = raw.split(/[;\n]/).filter(s => s.trim());
            const points = pairs.map(pair => {
                const parts = pair.trim().split(/[,\s]+/).filter(p => p.trim());
                if (parts.length < 2) return null;
                return { x: parseFloat(parts[0]), z: parseFloat(parts[1]) };
            }).filter(p => p !== null && !isNaN(p.x!) && !isNaN(p.z!)) as { x: number, z: number }[];
            if (points.length < 3) return alert("Need at least 3 valid points.");
            const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const cz = points.reduce((sum, p) => sum + p.z, 0) / points.length;
            const id = 'plot_' + Date.now();
            const newItem = {
                unitId: id, unitCode: "Imported Plot", type: 'flat',
                position: { x: cx, y: 0.5, z: cz }, rotation: { x: 0, y: 0, z: 0 },
                dimensions: { w: 1, h: 1, d: 1 }, color: '#00d2ff',
                metadata: { polyPoints: points }
            };
            const nextLayout = [...localLayout, newItem];
            setLocalLayout(nextLayout);
            addToHistory(nextLayout);
            setSelectedUnitId(id);
        } catch (e) { alert("Invalid format."); }
    };

    // Get Selected Item Dimensions for UI

    const selectedItem = localLayout.find(l => l.unitId === selectedUnitId);


    return (
        <div className="d-flex h-100 bg-secondary bg-opacity-10 position-relative overflow-hidden">
            {/* LEFT DRAWER - UNITS */}
            {!previewMode && (
                <div
                    className="bg-white border-end shadow-lg d-flex flex-column transition-all position-absolute top-0 start-0 h-100"
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        width: leftSidebarOpen ? '280px' : '0',
                        minWidth: leftSidebarOpen ? '280px' : '0',
                        transition: '0.3s ease-in-out',
                        opacity: leftSidebarOpen ? 1 : 0,
                        zIndex: 1010,
                        overflow: 'hidden'
                    }}
                >
                    <div className="p-2 border-bottom d-flex flex-column bg-light bg-opacity-50">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <h6 className="fw-bold mb-0 extra-small text-uppercase text-muted">Project Explorer</h6>
                            <button className="btn btn-xs btn-light" onClick={() => setLeftSidebarOpen(false)}><i className="bi bi-chevron-left"></i></button>
                        </div>
                        <div className="btn-group btn-group-sm w-100 shadow-none">
                            <button className={`btn btn-xs ${leftSidebarTab === 'units' ? 'btn-dark' : 'btn-outline-secondary border-0'}`} onClick={() => setLeftSidebarTab('units')}>Units</button>
                            <button className={`btn btn-xs ${leftSidebarTab === 'layers' ? 'btn-dark' : 'btn-outline-secondary border-0'}`} onClick={() => setLeftSidebarTab('layers')}>Layers ({localLayout.length})</button>
                        </div>
                    </div>

                    <div className="flex-grow-1 overflow-auto p-2">
                        {leftSidebarTab === 'units' ? (
                            <div className="list-group list-group-flush">
                                {units.map(unit => {
                                    const isPlaced = localLayout.some(l => l.unitId === unit.id);
                                    const isSelected = selectedUnitId === unit.id;

                                    return (
                                        <button
                                            key={unit.id}
                                            type="button"
                                            className={`list-group-item list-group-item-action border-0 mb-1 rounded-3 d-flex justify-content-between align-items-center py-2 px-3 ${isSelected ? 'active shadow-sm' : (isPlaced ? 'bg-success bg-opacity-10 text-success fw-medium' : 'text-muted')}`}
                                            onClick={() => {
                                                if (selectedUnitId && !units.some(u => u.id === selectedUnitId)) {
                                                    handleAssignUnit(unit.id);
                                                } else {
                                                    setSelectedUnitId(unit.id);
                                                    if (drawMode === 'pointer') setDrawMode('rect');
                                                }
                                            }}
                                            style={{ fontSize: '12px' }}
                                        >
                                            <div className="text-truncate" style={{ maxWidth: '160px' }}>
                                                <i className={`bi ${isPlaced ? 'bi-check-circle-fill' : 'bi-circle'} me-2 small`}></i>
                                                {unit.unitCode}
                                            </div>
                                            {isPlaced && !isSelected && <span className="extra-small opacity-50">Placed</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {localLayout.length === 0 && <div className="text-center p-4 text-muted small">No layers yet.<br />Start drawing!</div>}
                                {localLayout.map((item, idx) => {
                                    const isAssigned = units.some(u => u.id === item.unitId);
                                    const isSelected = selectedUnitId === item.unitId;
                                    const icon = item.metadata?.polyPoints ? 'bi-pentagon' : (item.dimensions?.w ? 'bi-square' : 'bi-geo-alt');

                                    return (
                                        <button
                                            key={item.unitId}
                                            type="button"
                                            className={`list-group-item list-group-item-action border-0 mb-1 rounded-3 py-2 px-3 ${isSelected ? 'active shadow-sm' : 'hover-bg-light text-muted'}`}
                                            onClick={() => setSelectedUnitId(item.unitId)}
                                            onMouseEnter={() => setHoveredUnitId(item.unitId)}
                                            onMouseLeave={() => setHoveredUnitId(null)}
                                            style={{ fontSize: '12px' }}
                                        >
                                            <div className="d-flex align-items-center w-100">
                                                <i className={`bi ${icon} me-2 ${isSelected ? 'text-white' : 'text-primary'} opacity-75`}></i>
                                                <div className="text-truncate flex-grow-1" style={{ maxWidth: '140px' }}>
                                                    {item.unitCode}
                                                </div>
                                                {!isAssigned && <span className="badge bg-warning text-dark extra-small ms-auto" style={{ fontSize: '8px' }}>Draft</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TOGGLE LEFT BUTTON (when closed) */}
            {!previewMode && !leftSidebarOpen && (
                <button
                    className="btn btn-dark btn-sm position-absolute rounded-0 rounded-end shadow-sm"
                    style={{ left: '0', top: '50%', zIndex: 100 }}
                    onClick={() => setLeftSidebarOpen(true)}
                >
                    <i className="bi bi-chevron-right"></i>
                </button>
            )}

            {/* CENTER - CANVAS AREA */}
            <div className="flex-grow-1 h-100 position-relative d-flex align-items-center justify-content-center overflow-hidden">
                {previewMode && (
                    <button className="btn btn-dark btn-sm position-absolute top-0 end-0 m-3 shadow-sm z-3" onClick={() => setPreviewMode(false)}>
                        <i className="bi bi-x-lg me-2"></i>Exit Preview
                    </button>
                )}

                {/* ZOOM CONTROLS */}
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4 d-flex gap-2 p-2 bg-white rounded-4 shadow-lg border border-primary border-opacity-10" style={{ zIndex: 1020 }}>
                    <button className="btn btn-light btn-sm rounded-circle shadow-none" onClick={() => transformRef.current?.zoomOut()} title="Zoom Out (-)"><i className="bi bi-dash-lg"></i></button>
                    <div className="vr mx-1"></div>
                    <button className="btn btn-light btn-sm px-3 rounded-4 fw-bold extra-small text-primary shadow-none" onClick={() => transformRef.current?.resetTransform()} title="Reset View (Scale 1:1)">
                        {Math.round((transformRef.current?.state?.scale || 1) * 100)}%
                    </button>
                    <div className="vr mx-1"></div>
                    <button className="btn btn-light btn-sm rounded-circle shadow-none" onClick={() => transformRef.current?.zoomIn()} title="Zoom In (+)"><i className="bi bi-plus-lg"></i></button>
                    <div className="vr mx-1"></div>
                    <button className="btn btn-primary btn-sm rounded-circle shadow-none" onClick={() => transformRef.current?.centerView()} title="Center View"><i className="bi bi-crosshair"></i></button>
                </div>

                {/* HELP HINT */}
                <div className="position-absolute bottom-0 end-0 m-4 text-muted extra-small d-none d-md-block" style={{ zIndex: 1000 }}>
                    <div className="bg-white p-2 rounded shadow-sm border">
                        <div className="mb-1"><kbd className="bg-light text-dark">Space</kbd> + Drag to Pan</div>
                        <div className="mb-1"><kbd className="bg-light text-dark">Middle Click</kbd> to Pan</div>
                        <div><kbd className="bg-light text-dark">Double Click</kbd> to Finish Poly</div>
                    </div>
                </div>

                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.05}
                    maxScale={20}
                    centerOnInit={true}
                    limitToBounds={false}
                    wheel={{
                        wheelDisabled: canvasLocked,
                        smoothStep: 0.05,
                        step: 5, // Smaller steps for smoother scroll zoom
                        activationKeys: [] // No keys required to zoom
                    }}
                    zoomAnimation={{ disabled: false, size: 0.1 }}
                    alignmentAnimation={{ disabled: false }}
                    panning={{
                        disabled: canvasLocked || isDragging || isCreatingRect || (drawMode !== 'hand' && !isSpacePressed && !isMiddleMouseDown),
                        velocityDisabled: true,
                    }}
                    onPanningStart={() => setIsPanning(true)}
                    onPanningStop={() => {
                        setIsPanning(false);
                        setIsMiddleMouseDown(false);
                    }}
                    doubleClick={{ disabled: true }}
                >
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                        <div
                            ref={containerRef}
                            className="position-relative shadow-sm bg-white"
                            style={{
                                width: canvasSize.width,
                                height: canvasSize.height,
                                cursor: (drawMode === 'hand' || isSpacePressed || isMiddleMouseDown) ? (isPanning ? 'grabbing' : 'grab') : (drawMode === 'pointer' ? (isDragging ? 'grabbing' : 'auto') : 'crosshair'),
                                display: 'inline-block'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDoubleClick={() => {
                                if (drawMode === 'poly' && tempPolyPoints.length >= 3) {
                                    finishPoly();
                                }
                            }}
                        >
                            {/* Canvas Foundation */}
                            <div ref={imgRef} className="w-100 h-100 bg-light bg-opacity-10 shadow-inner position-absolute top-0 start-0" style={{ pointerEvents: 'none' }} />

                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt="Base Plan"
                                    className="position-absolute top-50 start-50 translate-middle"
                                    style={{
                                        pointerEvents: 'none',
                                        opacity: 0.4,
                                        maxWidth: 'none',
                                        display: 'block'
                                    }}
                                />
                            )}

                            {/* SVG Overlay */}
                            <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none' }}>
                                {/* Grid Overlay */}
                                {snapToGrid && (
                                    <defs>
                                        <pattern id="gridPattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                                            <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                                        </pattern>
                                    </defs>
                                )}
                                {snapToGrid && <rect width="100%" height="100%" fill="url(#gridPattern)" />}

                                {localLayout.slice().sort((a, b) => {
                                    const aIsFrame = a.unitId.startsWith('frame');
                                    const bIsFrame = b.unitId.startsWith('frame');
                                    if (aIsFrame && !bIsFrame) return -1;
                                    if (!aIsFrame && bIsFrame) return 1;
                                    return 0;
                                }).map((item, idx) => {
                                    const px = getPixel({ x: item.position.x, z: item.position.z });
                                    const w = (item.dimensions?.w || 1) * scale;
                                    const h = (item.dimensions?.d || 1) * scale;
                                    const isSelected = selectedUnitId === item.unitId;

                                    const isFrame = item.unitId.startsWith('frame');

                                    return (
                                        <g key={idx} transform={item.metadata?.polyPoints ? "" : `rotate(${item.rotation?.y || 0}, ${px.x}, ${px.y})`} style={{ transition: isDragging ? 'none' : 'all 0.1s' }}>
                                            {item.metadata?.polyPoints ? (
                                                <polygon
                                                    points={item.metadata.polyPoints.map((p: any) => {
                                                        const pp = getPixel({ x: p.x, z: p.z });
                                                        return `${pp.x},${pp.y}`;
                                                    }).join(' ')}
                                                    fill={isFrame ? '#f1f3f5' : (item.color || '#00d2ff')}
                                                    fillOpacity={hoveredUnitId === item.unitId || isSelected ? (isFrame ? 0.9 : 0.6) : (isFrame ? 0.7 : 0.3)}
                                                    stroke={isSelected ? '#ff4d4d' : (hoveredUnitId === item.unitId ? '#007bff' : (isFrame ? '#adb5bd' : (item.color || '#333')))}
                                                    strokeWidth={isSelected ? 3 : (hoveredUnitId === item.unitId ? 2.5 : (isFrame ? 2 : 1.5))}
                                                    strokeDasharray={isFrame ? "4 4" : "none"}
                                                />
                                            ) : (
                                                (item.dimensions?.w || 0) > 1.5 || item.type === 'cabin' || isFrame ? (
                                                    <rect
                                                        x={px.x - w / 2} y={px.y - h / 2} width={w} height={h}
                                                        fill={isFrame ? '#f1f3f5' : (item.color || 'orange')}
                                                        fillOpacity={hoveredUnitId === item.unitId || isSelected ? (isFrame ? 0.9 : 0.7) : (isFrame ? 0.7 : 0.4)}
                                                        stroke={isSelected ? 'red' : (hoveredUnitId === item.unitId ? '#007bff' : (isFrame ? '#adb5bd' : 'black'))}
                                                        strokeWidth={isSelected ? 2.5 : (hoveredUnitId === item.unitId ? 2 : (isFrame ? 2 : 1))}
                                                        strokeDasharray={isFrame ? "4 4" : "none"}
                                                    />
                                                ) : (
                                                    <circle
                                                        cx={px.x} cy={px.y} r={hoveredUnitId === item.unitId ? 8 : 6}
                                                        fill={item.color || 'green'}
                                                        stroke={isSelected ? 'red' : (hoveredUnitId === item.unitId ? '#007bff' : 'white')}
                                                        strokeWidth={2}
                                                    />
                                                )
                                            )}
                                            {isFrame && (
                                                <text x={px.x - w / 2 + 5} y={px.y - h / 2 + 15} fill="#adb5bd" fontSize="10" fontWeight="bold" style={{ pointerEvents: 'none', fontStyle: 'italic' }}>FRAME</text>
                                            )}
                                            <text x={px.x} y={px.y} dy=".3em" textAnchor="middle" fill={isFrame ? "#6c757d" : "black"} fontSize={isFrame ? "14" : "10"} fontWeight="bold" style={{ textShadow: isFrame ? 'none' : '0 0 2px white', pointerEvents: 'none' }}>
                                                {item.unitCode}
                                            </text>

                                            {/* Corner Handles for selected item */}
                                            {isSelected && (
                                                item.metadata?.polyPoints ? (
                                                    item.metadata.polyPoints.map((p: any, pIdx: number) => {
                                                        const pp = getPixel({ x: p.x, z: p.z });
                                                        return (
                                                            <circle
                                                                key={pIdx} cx={pp.x} cy={pp.y} r="5"
                                                                fill="white" stroke="#ff4d4d" strokeWidth="2"
                                                                style={{ cursor: 'move', pointerEvents: 'auto' }}
                                                            />
                                                        );
                                                    })
                                                ) : (
                                                    <g>
                                                        {/* Resizers */}
                                                        <rect x={px.x - w / 2 - 4} y={px.y - h / 2 - 4} width="8" height="8" fill="white" stroke="#007bff" strokeWidth="1.5" style={{ cursor: 'nwse-resize', pointerEvents: 'auto' }} />
                                                        <rect x={px.x + w / 2 - 4} y={px.y - h / 2 - 4} width="8" height="8" fill="white" stroke="#007bff" strokeWidth="1.5" style={{ cursor: 'nesw-resize', pointerEvents: 'auto' }} />
                                                        <rect x={px.x - w / 2 - 4} y={px.y + h / 2 - 4} width="8" height="8" fill="white" stroke="#007bff" strokeWidth="1.5" style={{ cursor: 'nesw-resize', pointerEvents: 'auto' }} />
                                                        <rect x={px.x + w / 2 - 4} y={px.y + h / 2 - 4} width="8" height="8" fill="white" stroke="#007bff" strokeWidth="1.5" style={{ cursor: 'nwse-resize', pointerEvents: 'auto' }} />
                                                        {/* Rotation */}
                                                        <line x1={px.x} y1={px.y - h / 2} x2={px.x} y2={px.y - h / 2 - 25} stroke="#007bff" strokeWidth="1.5" />
                                                        <circle cx={px.x} cy={px.y - h / 2 - 25} r="6" fill="white" stroke="#007bff" strokeWidth="1.5" style={{ cursor: 'grab', pointerEvents: 'auto' }} />
                                                    </g>
                                                )
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Temp Poly Render */}
                                {drawMode === 'poly' && tempPolyPoints.length > 0 && cursorPos && (
                                    <line
                                        x1={tempPolyPoints[tempPolyPoints.length - 1].x}
                                        y1={tempPolyPoints[tempPolyPoints.length - 1].y}
                                        x2={cursorPos.x}
                                        y2={cursorPos.y}
                                        stroke="red" strokeWidth="2" strokeDasharray="4"
                                    />
                                )}
                                {drawMode === 'poly' && tempPolyPoints.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="5" fill={i === 0 ? "green" : "red"} stroke="white" strokeWidth="2" />
                                ))}
                                {drawMode === 'poly' && tempPolyPoints.length > 1 && (
                                    <polyline
                                        points={tempPolyPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                        fill="none" stroke="red" strokeDasharray="4"
                                    />
                                )}

                                {/* Rect Preview */}
                                {isCreatingRect && rectStart && dragStart && (
                                    <rect
                                        x={Math.min(rectStart.x, dragStart.x)}
                                        y={Math.min(rectStart.y, dragStart.y)}
                                        width={Math.abs(rectStart.x - dragStart.x)}
                                        height={Math.abs(rectStart.y - dragStart.y)}
                                        fill="rgba(0, 123, 255, 0.2)"
                                        stroke="#007bff"
                                        strokeWidth="2"
                                        strokeDasharray="4"
                                    />
                                )}

                                {/* Ghost Previews */}
                                {!isDragging && !isCreatingRect && cursorPos && (
                                    <g style={{ opacity: 0.3, pointerEvents: 'none' }}>
                                        {drawMode === 'rect' && (
                                            <rect
                                                x={cursorPos.x - 75} y={cursorPos.y - 75} width={150} height={150}
                                                fill="rgba(0,0,0,0.1)" stroke="black" strokeWidth="1" strokeDasharray="2"
                                            />
                                        )}
                                        {drawMode === 'point' && (
                                            <circle
                                                cx={cursorPos.x} cy={cursorPos.y} r={10}
                                                fill="rgba(0,0,0,0.1)" stroke="black" strokeWidth="1" strokeDasharray="2"
                                            />
                                        )}
                                    </g>
                                )}
                            </svg>

                            {/* Poly Finish Button */}
                            {drawMode === 'poly' && tempPolyPoints.length >= 3 && (
                                <button
                                    className="btn btn-sm btn-success position-absolute"
                                    style={{
                                        top: tempPolyPoints[tempPolyPoints.length - 1].y + 10,
                                        left: tempPolyPoints[tempPolyPoints.length - 1].x + 10,
                                        pointerEvents: 'auto',
                                        zIndex: 10
                                    }}
                                    onClick={(e) => { e.stopPropagation(); finishPoly(); }}
                                >
                                    Finish
                                </button>
                            )}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
            <style jsx>{`
                .designer-canvas {
                    background-size: 20px 20px;
                    background-image: radial-gradient(circle, #e0e0e0 1px, transparent 1px);
                    cursor: ${drawMode === 'hand' ? (isDragging ? 'grabbing' : 'grab') : (drawMode === 'pointer' ? 'default' : 'crosshair')};
                }
                .marker-item {
                    transition: filter 0.2s;
                    cursor: ${drawMode === 'pointer' ? (isDragging ? 'grabbing' : 'grab') : ((drawMode === 'hand' || isSpacePressed || isMiddleMouseDown) ? 'inherit' : 'crosshair')};
                }
                .marker-item:hover {
                    filter: brightness(1.1);
                }
                .resize-handle {
                    cursor: nwse-resize;
                }
                .resize-handle.tr, .resize-handle.bl {
                    cursor: nesw-resize;
                }
                .rotate-handle {
                    cursor: alias;
                }
            `}</style>
            {/* TOGGLE RIGHT BUTTON (when closed) */}
            {
                !previewMode && !rightSidebarOpen && (
                    <button
                        className="btn btn-dark btn-sm position-absolute rounded-0 rounded-start shadow-sm"
                        style={{ right: '0', top: '50%', zIndex: 100 }}
                        onClick={() => setRightSidebarOpen(true)}
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                )
            }

            {/* RIGHT DRAWER - TOOLS & SCENARIOS */}
            {
                !previewMode && (
                    <div
                        className="bg-white border-start shadow-lg d-flex flex-column transition-all position-absolute top-0 end-0 h-100"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            width: rightSidebarOpen ? '340px' : '0',
                            minWidth: rightSidebarOpen ? '340px' : '0',
                            transition: '0.3s ease-in-out',
                            opacity: rightSidebarOpen ? 1 : 0,
                            zIndex: 1010,
                            overflow: 'hidden'
                        }}
                    >
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                            <button className="btn btn-xs btn-light" onClick={() => setRightSidebarOpen(false)}><i className="bi bi-chevron-right"></i></button>
                            <h6 className="fw-bold mb-0 small text-uppercase">Blueprint Tools<i className="bi bi-tools ms-2"></i></h6>
                        </div>

                        <div className="p-3 flex-grow-1 overflow-auto">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="small fw-bold text-muted">Canvas History & View</span>
                                <div className="btn-group">
                                    <button
                                        className={`btn btn-xs ${canvasLocked ? 'btn-danger shadow-sm' : 'btn-outline-secondary'}`}
                                        onClick={() => setCanvasLocked(!canvasLocked)}
                                        title={canvasLocked ? "Unlock Canvas" : "Lock Canvas (Freeze Pan/Zoom)"}
                                    >
                                        <i className={`bi ${canvasLocked ? 'bi-lock-fill' : 'bi-unlock'}`}></i>
                                    </button>
                                    <button className="btn btn-xs btn-outline-secondary" onClick={handleUndo} disabled={historyStep <= 0} title="Undo"><i className="bi bi-arrow-counterclockwise"></i></button>
                                    <button className="btn btn-xs btn-outline-secondary" onClick={handleRedo} disabled={historyStep >= history.length - 1} title="Redo"><i className="bi bi-arrow-clockwise"></i></button>
                                </div>
                            </div>

                            <div className="btn-group w-100 mb-2 shadow-sm" role="group">
                                <input type="file" ref={fileInputRef} className="d-none" accept=".svg" onChange={handleSvgFileChange} />
                                <button type="button" className={`btn btn-sm ${drawMode === 'pointer' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('pointer')} title="Select / Move"><i className="bi bi-cursor-fill"></i></button>
                                <button type="button" className={`btn btn-sm ${drawMode === 'hand' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('hand')} title="Pan (Spacebar)"><i className="bi bi-hand-index-thumb"></i></button>
                            </div>
                            <div className="btn-group w-100 mb-4 shadow-sm" role="group">
                                <button type="button" className={`btn btn-sm ${drawMode === 'point' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('point')} title="Point Mode"><i className="bi bi-geo-alt-fill"></i></button>
                                <button type="button" className={`btn btn-sm ${drawMode === 'rect' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('rect')} title="Box Mode"><i className="bi bi-square"></i></button>
                                <button type="button" className={`btn btn-sm ${drawMode === 'poly' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('poly')} title="Polygon Mode"><i className="bi bi-pentagon"></i></button>
                                <button type="button" className={`btn btn-sm ${drawMode === 'frame' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setDrawMode('frame')} title="Frame Tool"><i className="bi bi-bounding-box-circles"></i></button>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary btn-sm w-100 mb-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                onClick={triggerSvgImport}
                                disabled={isExtractingSvg}
                            >
                                {isExtractingSvg ? (
                                    <><Loader size="sm" message="" />Extracting...</>
                                ) : (
                                    <><i className="bi bi-robot me-2"></i>Import & Scan SVG</>
                                )}
                            </button>

                            <button type="button" className="btn btn-outline-primary btn-sm w-100 mb-4 rounded-3 border-dashed" onClick={handleImportCoordinates}>
                                <i className="bi bi-file-earmark-arrow-up me-2"></i>Bulk Import Plot
                            </button>

                            {selectedItem && (
                                <div className="card mb-4 border-primary border-opacity-25 bg-primary-subtle bg-opacity-10 rounded-3 text-dark">
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <strong className="text-primary d-block">{selectedItem.unitCode}</strong>
                                                {!units.some(u => u.id === selectedItem.unitId) && (
                                                    <span className="badge bg-warning text-dark extra-small py-1">Unassigned Shape</span>
                                                )}
                                            </div>
                                            <div className="btn-group">
                                                <button type="button" className="btn btn-xs btn-outline-primary py-0" onClick={handleDuplicate} title="Duplicate"><i className="bi bi-copy"></i></button>
                                                <button type="button" className="btn btn-xs btn-outline-danger py-0" onClick={handleDelete} title="Delete"><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label extra-small mb-1 text-muted fw-bold text-uppercase">Assign to Unit</label>
                                            <div className="input-group">
                                                <select
                                                    className="form-select form-select-sm bg-white border-primary border-opacity-25"
                                                    value={units.some(u => u.id === selectedItem.unitId) ? selectedItem.unitId : ''}
                                                    onChange={(e) => handleAssignUnit(e.target.value)}
                                                >
                                                    <option value="">-- Select Unit --</option>
                                                    {units.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.unitCode} {localLayout.some(l => l.unitId === u.id && l.unitId !== selectedItem.unitId) ? '(Placed)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {units.some(u => u.id === selectedItem.unitId) && (
                                                    <button className="btn btn-outline-danger btn-sm" onClick={handleUnassign} title="Clear Assignment"><i className="bi bi-x-lg"></i></button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold">POS X</label>
                                                <input type="number" step="0.01" className="form-control form-control-sm" value={selectedItem.position?.x?.toFixed(2) || 0} onChange={(e) => handlePropertyChange('posX', e.target.value)} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold">POS Z</label>
                                                <input type="number" step="0.01" className="form-control form-control-sm" value={selectedItem.position?.z?.toFixed(2) || 0} onChange={(e) => handlePropertyChange('posZ', e.target.value)} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold">WIDTH (M)</label>
                                                <input type="number" step="0.1" className="form-control form-control-sm" value={selectedItem.dimensions?.w || 1} onChange={(e) => handlePropertyChange('width', e.target.value)} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold">DEPTH (M)</label>
                                                <input type="number" step="0.1" className="form-control form-control-sm" value={selectedItem.dimensions?.d || 1} onChange={(e) => handlePropertyChange('depth', e.target.value)} />
                                            </div>
                                            <div className="col-12 mt-3">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold d-flex justify-content-between">
                                                    <span>ROTATION</span>
                                                    <span>{Math.round(selectedItem.rotation?.y || 0)}°</span>
                                                </label>
                                                <input type="range" className="form-range" min="0" max="360" value={selectedItem.rotation?.y || 0} onChange={(e) => handlePropertyChange('rotation', e.target.value)} />
                                            </div>
                                            <div className="col-12 mt-3">
                                                <label className="form-label extra-small mb-1 text-muted fw-bold text-uppercase">Preferred Demo Plan</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={selectedItem.metadata?.preferredPlanId || ''}
                                                    onChange={(e) => handlePropertyChange('preferredPlanId', e.target.value)}
                                                >
                                                    <option value="">-- Automatic (Based on size) --</option>
                                                    {DEMO_HOUSE_PLANS.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.tier})</option>
                                                    ))}
                                                </select>
                                                <p className="extra-small text-muted mt-1"><i className="bi bi-info-circle me-1"></i>Pre-assign a specific design for this plot.</p>
                                            </div>
                                        </div>

                                        {selectedItem.metadata?.polyPoints && (
                                            <div className="mt-4 border-top pt-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <label className="extra-small mb-0 text-muted fw-bold text-uppercase">Plot Points (World Coordinates)</label>
                                                </div>
                                                <div className="rounded-3 border border-secondary border-opacity-10 overflow-hidden" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                                    <table className="table table-sm table-hover mb-0" style={{ fontSize: '11px' }}>
                                                        <thead className="bg-light">
                                                            <tr><th className="ps-2">#</th><th>X</th><th>Z</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedItem.metadata.polyPoints.map((p: any, pIdx: number) => (
                                                                <tr key={pIdx}>
                                                                    <td className="ps-2 text-muted">{pIdx + 1}</td>
                                                                    <td className="p-0"><input type="number" step="0.1" className="form-control form-control-xs border-0 bg-transparent text-primary" value={p.x.toFixed(1)} onChange={(e) => handlePolyPointChange(pIdx, 'x', Number(e.target.value))} /></td>
                                                                    <td className="p-0"><input type="number" step="0.1" className="form-control form-control-xs border-0 bg-transparent text-primary" value={p.z.toFixed(1)} onChange={(e) => handlePolyPointChange(pIdx, 'z', Number(e.target.value))} /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="extra-small text-muted mt-2 mb-0"><i className="bi bi-info-circle me-1"></i>Edit values to move points precisely.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="row g-3 mb-4">
                                <div className="col-6">
                                    <label className="form-label small fw-bold text-muted">GRID SCALE</label>
                                    <div className="input-group input-group-sm">
                                        <input type="number" className="form-control" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                                        <span className="input-group-text">px</span>
                                    </div>
                                </div>
                                <div className="col-6 d-flex flex-column justify-content-end">
                                    <div className="form-check form-switch mb-1">
                                        <input className="form-check-input" type="checkbox" id="snapGrid" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
                                        <label className="form-check-label small fw-bold text-dark" htmlFor="snapGrid">SNAP</label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2 mb-4">
                                <button type="button" className="btn btn-primary btn-sm w-100 shadow-sm" onClick={() => setPreviewMode(true)}>
                                    <i className="bi bi-eye me-2"></i>Live 3D View
                                </button>
                                <button type="button" className="btn btn-outline-dark btn-sm w-100 border-2" onClick={() => setShowJson(true)}>
                                    <i className="bi bi-code-slash me-2"></i>Inspect
                                </button>
                            </div>

                            <h6 className="fw-bold mb-3 small text-muted text-uppercase letter-spacing-1">Environment Objects</h6>
                            <div className="row g-2 mb-4 text-dark">
                                {SCENARIO_TYPES.map(s => (
                                    <div className="col-4" key={s.id}>
                                        <button
                                            type="button"
                                            className={`btn w-100 d-flex flex-column align-items-center justify-content-center p-2 rounded-3 border-2 transition-all ${selectedUnitId === s.id ? 'btn-primary border-primary' : 'btn-outline-light bg-light text-dark'}`}
                                            onClick={() => { setSelectedUnitId(s.id); setDrawMode(s.id === 'road' || s.id === 'river' ? 'poly' : 'point'); }}
                                            style={{ height: '70px' }}
                                        >
                                            <i className={`bi ${s.icon} mb-1 fs-5`}></i>
                                            <span style={{ fontSize: '10px', fontWeight: '600' }}>{s.name}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <label className="btn btn-outline-dark btn-sm w-100 py-2 border-2" style={{ borderStyle: 'dashed' }}>
                                <i className="bi bi-upload me-2"></i>Replace Base Plan
                                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                )
            }

            {showJson && (
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
                    <div className="card shadow-lg w-75" style={{ maxHeight: '90vh' }}>
                        <div className="card-header d-flex justify-content-between p-3"><h6 className="mb-0 text-dark fw-bold">JSON Structure</h6><button type="button" className="btn-close" onClick={() => setShowJson(false)}></button></div>
                        <div className="card-body p-0 border-0"><textarea className="form-control border-0 font-monospace p-3 bg-dark text-success" style={{ height: '600px', borderRadius: '0' }} readOnly value={JSON.stringify(localLayout, null, 2)}></textarea></div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .extra-small { font-size: 10px; }
                .letter-spacing-1 { letter-spacing: 1px; }
                .transition-all { transition: all 0.3s ease-in-out; }
                :global(.btn-xs) { padding: 0.1rem 0.4rem; font-size: 0.75rem; }
            `}</style>
        </div>
    );
}
