'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';

// Component to handle SVG to 3D Shape conversion
const SvgTo3DShape = ({ svgContent, mapping, units, onPlotHover }: {
    svgContent: string,
    mapping: any,
    units: any[],
    onPlotHover?: (unit: any | null) => void
}) => {
    // Use useMemo to prevent unnecessary re-calculations and flickering
    const shapes = useMemo(() => {
        if (!svgContent) return [];

        try {
            const loader = new SVGLoader();
            const svgData = loader.parse(svgContent);
            const paths = svgData.paths;
            const newShapes: any[] = [];

            paths.forEach((path, index) => {
                const pathId = path.userData?.node?.id || path.userData?.style?.id || `plot-${index + 1}`;
                const unitId = mapping[pathId];
                const unit = units.find(u => String(u.id) === String(unitId));

                // Convert SVG paths to THREE.Shapes with holes support
                const pathShapes = SVGLoader.createShapes(path);

                pathShapes.forEach((shape) => {
                    const isPlot = !!unit;
                    const originalColor = path.color ? `#${path.color.getHexString()}` : '#e2e8f0';
                    const lowerId = pathId.toLowerCase();

                    // 1. Determine Color: Use status color for plots, original for others
                    let color = originalColor;
                    if (isPlot) {
                        color = unit.status === 'sold' ? '#f43f5e' :
                            unit.status === 'occupied' ? '#fb7185' :
                                unit.status === 'available' ? '#4ade80' :
                                    unit.status === 'maintenance' ? '#94a3b8' : originalColor;
                    } else if (lowerId.includes('road') || lowerId.includes('street')) {
                        color = '#1e293b'; // Standard road color if not specified
                    }

                    // 2. Determine Height: Plots are tall, roads/bg are flat
                    let height = 2; // Default
                    if (isPlot) {
                        height = 12; // Plots stand out
                    } else if (lowerId.includes('road') || lowerId.includes('street') || lowerId.includes('path')) {
                        height = 0.5; // Slightly above ground
                    } else if (lowerId.includes('bg') || lowerId.includes('background') || lowerId.includes('land') || lowerId.includes('grass')) {
                        height = 0.1; // Flat ground
                    } else {
                        height = 4; // Other structures (trees, walls, etc)
                    }

                    newShapes.push({
                        id: pathId,
                        shape,
                        color,
                        height,
                        isPlot,
                        unit: unit || null,
                        unitName: unit?.name
                    });
                });
            });

            return newShapes;
        } catch (err) {
            console.error('Error parsing SVG for 3D conversion:', err);
            return [];
        }
    }, [svgContent, mapping, units]);

    return (
        <group rotation={[0, 0, Math.PI]} position={[0, 0, 0]} scale={[1, -1, 1]}>
            {shapes.map((s, i) => (
                <group key={`${s.id}-${i}`}>
                    <mesh
                        position={[0, 0, 0]}
                        castShadow
                        receiveShadow
                        onPointerOver={(e) => {
                            e.stopPropagation();
                            if (s.isPlot && s.unit && onPlotHover) {
                                document.body.style.cursor = 'pointer';
                                onPlotHover(s.unit);
                            }
                        }}
                        onPointerOut={(e) => {
                            e.stopPropagation();
                            document.body.style.cursor = 'default';
                            if (onPlotHover) onPlotHover(null);
                        }}
                    >
                        <extrudeGeometry
                            args={[s.shape, {
                                depth: s.height,
                                bevelEnabled: true,
                                bevelThickness: 0.2,
                                bevelSize: 0.1,
                                bevelOffset: 0,
                                bevelSegments: 3
                            }]}
                        />
                        <meshStandardMaterial
                            color={s.color}
                            roughness={s.isPlot ? 0.4 : 0.8}
                            metalness={s.isPlot ? 0.3 : 0.1}
                        />
                    </mesh>
                    {s.isPlot && s.unitName && (
                        <Text
                            position={[
                                s.shape.getPoints()[0]?.x || 0,
                                s.shape.getPoints()[0]?.y || 0,
                                s.height + 4
                            ]}
                            rotation={[0, 0, 0]}
                            fontSize={4}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.5}
                            outlineColor="#000"
                        >
                            {s.unitName}
                        </Text>
                    )}
                </group>
            ))}
        </group>
    );
};

export default function Svg3DConverterPage() {
    const router = useRouter();
    const [svgData, setSvgData] = useState<{ content: string, mapping: any, units: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredUnit, setHoveredUnit] = useState<any | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const content = localStorage.getItem('svg_to_3d_content');
        const mapping = JSON.parse(localStorage.getItem('svg_to_3d_mapping') || '{}');
        const units = JSON.parse(localStorage.getItem('svg_to_3d_units') || '[]');

        if (content) {
            setSvgData({ content, mapping, units });
        }
        setLoading(false);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return { fill: '#4ade80', stroke: '#16a34a' };
            case 'occupied': return { fill: '#fb7185', stroke: '#e11d48' };
            case 'maintenance': return { fill: '#94a3b8', stroke: '#475569' };
            case 'sold': return { fill: '#f43f5e', stroke: '#9f1239' };
            default: return { fill: '#6366f1', stroke: '#4338ca' };
        }
    };

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

    if (!svgData) {
        return (
            <MainLayout activePage="properties">
                <div className="container-fluid p-4">
                    <div className="alert alert-warning rounded-4 shadow-sm border-0 p-5 text-center">
                        <i className="bi bi-exclamation-circle fs-1 mb-3 d-block"></i>
                        <h4 className="fw-bold">No SVG Data Found</h4>
                        <p className="text-muted">Please go back to the Plot Map Editor and click "Convert to 3D".</p>
                        <button onClick={() => router.back()} className="btn btn-primary rounded-4 px-4 mt-3">Go Back</button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="properties">
            <div className="container-fluid p-0" style={{ height: 'calc(100vh - 65px)', background: '#0f172a' }}>
                {/* Top Controls */}
                <div className="position-absolute top-0 w-100 p-4 z-3 d-flex justify-content-between align-items-center">
                    <div className="bg-white bg-opacity-10 backdrop-blur p-3 rounded-4 border border-white border-opacity-10 d-flex align-items-center gap-4 shadow-2xl">
                        <button onClick={() => router.back()} className="btn btn-link text-white text-decoration-none p-0">
                            <i className="bi bi-chevron-left me-2"></i>Back to Editor
                        </button>
                        <div className="vr bg-white opacity-25"></div>
                        <div>
                            <h5 className="mb-0 fw-bold text-white">SVG to 3D Converter</h5>
                            <p className="mb-0 text-white text-opacity-50 small">Extruded Real-time Visualization</p>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button className="btn btn-primary rounded-4 px-4 fw-bold shadow-lg hvr-translate-up" onClick={() => window.print()}>
                            <i className="bi bi-camera me-2"></i>Capture Preview
                        </button>
                        <button className="btn btn-success rounded-4 px-4 fw-bold shadow-lg hvr-translate-up">
                            <i className="bi bi-check-circle me-2"></i>Finalize 3D Model
                        </button>
                    </div>
                </div>

                {/* 3D Scene */}
                <div className="w-100 h-100" onMouseMove={handleMouseMove}>
                    <Canvas shadows dpr={[1, 2]}>
                        <color attach="background" args={['#0f172a']} />
                        <PerspectiveCamera makeDefault position={[0, 150, 300]} fov={50} />

                        <Suspense fallback={null}>
                            {/* Improved lighting setup to reduce flickering */}
                            <ambientLight intensity={0.6} />
                            <directionalLight
                                position={[50, 100, 50]}
                                intensity={1.2}
                                castShadow
                                shadow-mapSize-width={2048}
                                shadow-mapSize-height={2048}
                                shadow-camera-far={500}
                                shadow-camera-left={-200}
                                shadow-camera-right={200}
                                shadow-camera-top={200}
                                shadow-camera-bottom={-200}
                            />
                            <directionalLight position={[-50, 50, -50]} intensity={0.4} />

                            <SvgTo3DShape
                                svgContent={svgData.content}
                                mapping={svgData.mapping}
                                units={svgData.units}
                                onPlotHover={setHoveredUnit}
                            />

                            <Grid
                                infiniteGrid
                                fadeDistance={500}
                                fadeStrength={5}
                                cellSize={10}
                                sectionSize={50}
                                sectionColor="#1e293b"
                                cellColor="#334155"
                            />

                            <ContactShadows
                                resolution={1024}
                                scale={500}
                                blur={2}
                                opacity={0.3}
                                far={50}
                                color="#000000"
                                position={[0, -0.5, 0]}
                            />

                            <Environment preset="city" />
                        </Suspense>

                        {/* Fixed rotation center */}
                        <OrbitControls
                            makeDefault
                            target={[0, 0, 0]}
                            enableDamping
                            dampingFactor={0.05}
                            rotateSpeed={0.5}
                            zoomSpeed={0.8}
                        />
                    </Canvas>
                </div>

                {/* Hover Tooltip for 3D Plots */}
                {hoveredUnit && (
                    <div
                        className="position-fixed p-3 animate-fade-in"
                        style={{
                            left: mousePos.x + 20,
                            top: mousePos.y + 20,
                            zIndex: 9999,
                            minWidth: '220px',
                            pointerEvents: 'none',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderLeft: `5px solid ${getStatusColor(hoveredUnit.status).fill}`
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <span className="d-block extra-small text-uppercase fw-bold text-muted mb-1" style={{ letterSpacing: '0.05em' }}>Property Unit</span>
                                <h6 className="fw-bold text-dark mb-0">{hoveredUnit.name}</h6>
                            </div>
                            <span className="badge rounded-4 px-2 py-1 fw-bold" style={{
                                fontSize: '9px',
                                backgroundColor: getStatusColor(hoveredUnit.status).fill + '20',
                                color: getStatusColor(hoveredUnit.status).stroke
                            }}>
                                {hoveredUnit.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="mt-2 pt-2 border-top border-light">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted extra-small">Price</span>
                                <span className="fw-bold text-dark extra-small">${hoveredUnit.price?.toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted extra-small">Area</span>
                                <span className="text-dark fw-bold extra-small">{hoveredUnit.sizeSqft} sqft</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="position-absolute bottom-0 start-0 p-4 z-3">
                    <div className="bg-white bg-opacity-10 backdrop-blur p-3 rounded-4 border border-white border-opacity-10 shadow-lg">
                        <h6 className="text-white small fw-bold mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-palette text-primary"></i>
                            Aesthetic Codes
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-1" style={{ width: '12px', height: '12px', background: '#4ade80' }}></div>
                                <span className="text-white text-opacity-75" style={{ fontSize: '11px' }}>Available Plot</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-1" style={{ width: '12px', height: '12px', background: '#ff4d4d' }}></div>
                                <span className="text-white text-opacity-75" style={{ fontSize: '11px' }}>Sold Out</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-1" style={{ width: '12px', height: '12px', background: '#e2e8f0' }}></div>
                                <span className="text-white text-opacity-75" style={{ fontSize: '11px' }}>Environment Elements</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interaction Info */}
                <div className="position-absolute bottom-0 end-0 p-4 z-3">
                    <div className="bg-dark bg-opacity-50 text-white p-2 rounded-3 small border border-secondary border-opacity-25" style={{ fontSize: '10px' }}>
                        <i className="bi bi-mouse me-2"></i> Left-click to Rotate | Right-click to Pan | Scroll to Zoom
                    </div>
                </div>

            </div>

            <style jsx global>{`
        .backdrop-blur { backdrop-filter: blur(16px); }
        canvas { touch-action: none; }
        .extra-small { font-size: 10px; }
        .animate-fade-in { 
            animation: fadeIn 0.2s ease-out; 
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </MainLayout>
    );
}
