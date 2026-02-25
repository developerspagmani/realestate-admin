'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, ContactShadows, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';

// Component to handle SVG to 3D Shape conversion
const SvgTo3DShape = ({ svgContent, mapping, units }: { svgContent: string, mapping: any, units: any[] }) => {
    const [shapes, setShapes] = useState<any[]>([]);

    useEffect(() => {
        if (!svgContent) return;

        try {
            const loader = new SVGLoader();
            const svgData = loader.parse(svgContent);
            const paths = svgData.paths;
            const newShapes: any[] = [];

            paths.forEach((path, index) => {
                // Robust ID extraction from SVGLoader path data
                const pathId = path.userData?.node?.id || path.userData?.style?.id || `plot-${index + 1}`;
                if (!pathId) return;

                const unitId = mapping[pathId];
                const unit = units.find(u => String(u.id) === String(unitId));

                // Convert SVG paths to THREE.Shape
                const pathShapes = path.toShapes(true);

                pathShapes.forEach((shape) => {
                    // Identify if it's a plot or background
                    const isPlot = !!unit;
                    const color = isPlot ? (unit.status === 'sold' ? '#ff4d4d' : unit.status === 'occupied' ? '#ff9f43' : '#4ade80') : '#e2e8f0';
                    const height = isPlot ? 5 : 0.5;

                    newShapes.push({
                        id: pathId,
                        shape,
                        color,
                        height,
                        isPlot,
                        unitName: unit?.name
                    });
                });
            });

            setShapes(newShapes);
        } catch (err) {
            console.error('Error parsing SVG for 3D conversion:', err);
        }
    }, [svgContent, mapping, units]);

    return (
        <group rotation={[-Math.PI / 2, 0, 0]} position={[-200, 0, 200]}>
            {shapes.map((s, i) => (
                <group key={`${s.id}-${i}`}>
                    <mesh position={[0, 0, 0]}>
                        <extrudeGeometry
                            args={[s.shape, {
                                depth: s.height,
                                bevelEnabled: true,
                                bevelThickness: 0.1,
                                bevelSize: 0.1,
                                bevelOffset: 0,
                                bevelSegments: 3
                            }]}
                        />
                        <meshStandardMaterial color={s.color} roughness={0.3} metalness={0.2} />
                    </mesh>
                    {s.unitName && (
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <Text
                                position={[s.shape.getPoints()[0].x, s.shape.getPoints()[0].y, s.height + 2]}
                                rotation={[Math.PI / 2, 0, 0]}
                                fontSize={3}
                                color="white"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {s.unitName}
                            </Text>
                        </Float>
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

    useEffect(() => {
        const content = localStorage.getItem('svg_to_3d_content');
        const mapping = JSON.parse(localStorage.getItem('svg_to_3d_mapping') || '{}');
        const units = JSON.parse(localStorage.getItem('svg_to_3d_units') || '[]');

        if (content) {
            setSvgData({ content, mapping, units });
        }
        setLoading(false);
    }, []);

    if (loading) return <div className="p-5 text-center"><Loader size="md" message="Loading 3D View..." /></div>;

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
                <div className="w-100 h-100">
                    <Canvas shadows dpr={[1, 2]}>
                        <color attach="background" args={['#0f172a']} />
                        <PerspectiveCamera makeDefault position={[0, 150, 300]} fov={50} />

                        <Suspense fallback={null}>
                            <ambientLight intensity={0.5} />
                            <spotLight position={[100, 200, 100]} angle={0.15} penumbra={1} intensity={1} castShadow />
                            <directionalLight position={[-10, 20, 10]} intensity={1.5} />

                            <SvgTo3DShape
                                svgContent={svgData.content}
                                mapping={svgData.mapping}
                                units={svgData.units}
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

                            <ContactShadows resolution={1024} scale={500} blur={2} opacity={0.3} far={10} color="#000000" />

                            <Environment preset="city" />
                        </Suspense>

                        <OrbitControls makeDefault />
                    </Canvas>
                </div>

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
      `}</style>
        </MainLayout>
    );
}
