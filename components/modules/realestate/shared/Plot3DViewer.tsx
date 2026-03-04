'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SVGLoader } from 'three-stdlib';
import * as THREE from 'three';

interface Plot3DViewerProps {
    svgContent: string;
    mapping: any;
    units: any[];
    theme: any;
    currencySymbol?: string;
    onClose: () => void;
    onBookingSelect?: (unit: any) => void;
}

export default function Plot3DViewer({ svgContent, mapping, units, theme, currencySymbol = '$', onClose, onBookingSelect }: Plot3DViewerProps) {
    const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
    const [threeJSLoaded, setThreeJSLoaded] = useState(false);
    const [zoomValue, setZoomValue] = useState(300);

    const mountRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const frameRef = useRef<number | null>(null);

    // Camera control state (following Workspace3D pattern exactly)
    const cameraDistance = useRef(300);
    const cameraAngleX = useRef(0);
    const cameraAngleY = useRef(0.5);
    const cameraTarget = useRef({ x: 0, y: 0, z: 0 });
    const isDragging = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 0x4ade80;
            case 'occupied': return 0xfb7185;
            case 'maintenance': return 0x94a3b8;
            case 'sold': return 0xef4444;
            default: return 0x6366f1;
        }
    };

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadThreeJS = async () => {
            try {
                const THREE = await import('three');
                setThreeJSLoaded(true);

                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    const cleanup = initializeScene(THREE);
                    if (cleanup) cleanupRef.current = cleanup;
                }, 100);
            } catch (err) {
                console.error('Three.js loading error:', err);
            }
        };

        loadThreeJS();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [svgContent, mapping, units]);

    const initializeScene = (THREE: any) => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x090e1a);

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        scene.add(hemiLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(200, 500, 200);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        scene.add(directionalLight);

        const svgGroup = new THREE.Group();
        const plotMeshes: THREE.Mesh[] = [];

        try {
            const loader = new SVGLoader();
            const svgData = loader.parse(svgContent);

            svgData.paths.forEach((path, index) => {
                const pathId = path.userData?.node?.id || path.userData?.style?.id || `plot-${index + 1}`;
                const unitId = mapping[pathId];
                const unit = units.find((u: any) => String(u.id) === String(unitId));

                // Using three-stdlib toShapes
                const pathShapes = (path as any).toShapes(true);

                pathShapes.forEach((shape: any) => {
                    const isPlot = !!unit;
                    const lowerId = pathId.toLowerCase();
                    let color = path.color ? path.color.getHex() : 0xe2e8f0;
                    if (isPlot && unit) color = getStatusColor(unit.status);
                    else if (lowerId.includes('road') || lowerId.includes('street')) color = 0x1e293b;

                    let h = isPlot ? 15 :
                        (lowerId.includes('road') || lowerId.includes('street')) ? 0.5 :
                            (lowerId.includes('bg') || lowerId.includes('land') || lowerId.includes('grass')) ? 0.1 : 5;

                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: h,
                        bevelEnabled: isPlot,
                        bevelThickness: 0.5,
                        bevelSize: 0.3,
                        bevelSegments: 3
                    });

                    const material = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: isPlot ? 0.3 : 0.8,
                        metalness: isPlot ? 0.4 : 0.1
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.position.y = h;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    if (isPlot && unit) {
                        mesh.userData = { unit, isPlot: true };
                        plotMeshes.push(mesh);
                    }
                    svgGroup.add(mesh);
                });
            });

            // Center the group (Flipped as requested previously)
            const box = new THREE.Box3().setFromObject(svgGroup);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            svgGroup.position.x = -center.x;
            svgGroup.position.z = -center.z;

            // Apply flip scale if requested earlier
            const flipGroup = new THREE.Group();
            flipGroup.scale.set(-1, 1, 1);
            flipGroup.add(svgGroup);
            scene.add(flipGroup);

            // Set initial camera distance based on size
            const maxDim = Math.max(size.x, size.z, 200);
            cameraDistance.current = maxDim * 1.5;
            setZoomValue(cameraDistance.current);

        } catch (err) {
            console.error('SVG Parsing Error:', err);
        }

        const floorGrid = new THREE.GridHelper(5000, 100, 0x1e293b, 0x1e293b);
        floorGrid.position.y = -0.1;
        scene.add(floorGrid);

        // Interaction Handlers (Matching Workspace3D)
        const onMouseDown = (event: MouseEvent) => {
            isDragging.current = true;
            previousMousePosition.current = { x: event.clientX, y: event.clientY };
        };

        const onMouseMove = (event: MouseEvent) => {
            if (!mountRef.current) return;
            if (isDragging.current) {
                const deltaX = event.clientX - previousMousePosition.current.x;
                const deltaY = event.clientY - previousMousePosition.current.y;

                cameraAngleX.current += deltaX * 0.01;
                cameraAngleY.current = Math.max(0.1, Math.min(1.5, cameraAngleY.current - deltaY * 0.01));

                previousMousePosition.current = { x: event.clientX, y: event.clientY };
            }

            // Raycasting for hover (Selection logic)
            const rect = mountRef.current.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(plotMeshes);

            if (intersects.length > 0) {
                const unit = (intersects[0].object as any).userData.unit;
                setSelectedUnit(unit);
                document.body.style.cursor = 'pointer';
            } else {
                setSelectedUnit(null);
                document.body.style.cursor = 'default';
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
        };

        const onMouseWheel = (event: WheelEvent) => {
            event.preventDefault();
            const delta = event.deltaY * 0.5;
            cameraDistance.current = Math.max(100, Math.min(5000, cameraDistance.current + delta));
            setZoomValue(cameraDistance.current);
        };

        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
        window.addEventListener('resize', handleResize);

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);

            const target = cameraTarget.current;
            camera.position.x = target.x + cameraDistance.current * Math.sin(cameraAngleX.current) * Math.cos(cameraAngleY.current);
            camera.position.y = target.y + cameraDistance.current * Math.sin(cameraAngleY.current);
            camera.position.z = target.z + cameraDistance.current * Math.cos(cameraAngleX.current) * Math.cos(cameraAngleY.current);
            camera.lookAt(target.x, target.y, target.z);

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('wheel', onMouseWheel);
            window.removeEventListener('resize', handleResize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (mountRef.current?.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            document.body.style.cursor = 'default';
        };
    };

    return (
        <div className="plot-3d-viewer fixed-top w-100 h-100 overflow-hidden" style={{ zIndex: 9999, background: '#090e1a' }}>
            {/* Header */}
            <div className="position-absolute top-0 w-100 p-4 z-3 d-flex justify-content-between align-items-center">
                <div className="bg-dark bg-opacity-50 blur p-4 rounded-5 border border-white border-opacity-10 d-flex align-items-center gap-4 shadow-2xl">
                    <div className="bg-primary bg-opacity-20 p-2 rounded-3">
                        <i className="bi bi-box-seam text-primary fs-4"></i>
                    </div>
                </div>

                <button
                    className="btn btn-outline-light rounded-4 px-5 fw-bold shadow-lg"
                    onClick={onClose}
                >
                    <i className="bi bi-x-lg me-2"></i>
                    Close
                </button>
            </div>

            <div ref={mountRef} className="w-100 h-100" />

            {/* Legend (Exactly matching Workspace3D) */}
            <div className="position-absolute top-0 start-0 m-3 mt-5 pt-5 ml-4 bg-white bg-opacity-75 p-3 rounded-4 shadow-lg backdrop-blur" style={{ backdropFilter: 'blur(8px)', zIndex: 10 }}>
                <h6 className="mb-2 fw-bold small text-uppercase">Property Status</h6>
                <div className="d-flex align-items-center mb-1">
                    <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#4ade80' }}></div>
                    <small className="extra-small">Available</small>
                </div>
                <div className="d-flex align-items-center mb-1">
                    <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ef4444' }}></div>
                    <small className="extra-small">Sold Out</small>
                </div>
                <div className="d-flex align-items-center">
                    <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#fb7185' }}></div>
                    <small className="extra-small">Reserved</small>
                </div>
            </div>

            {/* Selected Info (Exactly matching Workspace3D) */}
            {selectedUnit && (
                <div className="position-absolute top-0 end-0 m-3 mt-5 pt-5 mr-4 bg-white bg-opacity-75 p-3 rounded-4 shadow-lg backdrop-blur border border-white border-opacity-50" style={{ backdropFilter: 'blur(8px)', minWidth: '220px', zIndex: 10 }}>
                    <h6 className="mb-2 fw-bold small text-uppercase text-primary border-bottom pb-2">Listing Overview</h6>
                    <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Unit:</span>
                            <span className="fw-bold">{selectedUnit.name}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Status:</span>
                            <span className={`badge px-2 py-1 ${selectedUnit.status === 'available' ? 'bg-success text-white' : 'bg-danger text-white'}`}>{selectedUnit.status.toUpperCase()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                            <span className="fw-bold text-primary">{currencySymbol}{selectedUnit.price?.toLocaleString('en-US')}</span>
                            {onBookingSelect && (
                                <button
                                    className="btn btn-primary btn-sm rounded-4 px-3 fw-bold"
                                    onClick={() => onBookingSelect(selectedUnit)}
                                >
                                    Reserve
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Guide (Exactly matching Workspace3D) */}
            <div className="position-absolute bottom-0 start-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-sm backdrop-blur" style={{ backdropFilter: 'blur(8px)' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="text-center"><i className="bi bi-mouse2 h5 d-block mb-1"></i><small className="extra-small text-muted">Rotate</small></div>
                    <div className="text-center"><i className="bi bi-mouse h5 d-block mb-1"></i><small className="extra-small text-muted">Zoom</small></div>
                    <div className="text-center"><i className="bi bi-cursor h5 d-block mb-1"></i><small className="extra-small text-muted">Select</small></div>
                </div>
            </div>

            {/* Zoom Slider (Exactly matching Workspace3D) */}
            <div className="position-absolute bottom-0 end-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-sm backdrop-blur" style={{ backdropFilter: 'blur(8px)', width: '180px' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="extra-small fw-bold text-uppercase text-muted">Zoom Level</small>
                    <span className="badge bg-primary extra-small">{Math.round(((5000 - zoomValue) / 4900) * 100)}%</span>
                </div>
                <input
                    type="range"
                    className="form-range"
                    min="100"
                    max="5000"
                    step="1"
                    value={zoomValue}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setZoomValue(val);
                        cameraDistance.current = val;
                    }}
                />
            </div>

            <style jsx global>{`
                .blur { backdrop-filter: blur(16px); }
                .extra-small { font-size: 10px; }
            `}</style>
        </div>
    );
}
