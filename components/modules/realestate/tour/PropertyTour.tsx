'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Html,
    Environment,
    ContactShadows,
    Float,
    Text,
    useCursor
} from '@react-three/drei';
import * as THREE from 'three';
import Loader from '@/components/common/Loader';

// Types for the Tour
interface Hotspot {
    id: string;
    name: string;
    description: string;
    position: [number, number, number];
    price: string;
    area: string;
}

interface MaterialConfig {
    id: string;
    label: string;
    color: string;
    type: 'wall' | 'floor';
}

interface PropertyTourProps {
    propertyId: string;
    data?: {
        hotspots: Hotspot[];
        materials: MaterialConfig[];
    };
}

// Sub-component: Accessory Objects
const Accessory = ({ type, position, rotation = [0, 0, 0] }: { type: 'lamp' | 'plant' | 'book' | 'rug' | 'painting' | 'bookshelf', position: [number, number, number], rotation?: [number, number, number] }) => {
    switch (type) {
        case 'lamp':
            return (
                <group position={position} rotation={rotation}>
                    <mesh position={[0, 0.7, 0]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, 1.4, 0]} castShadow>
                        <cylinderGeometry args={[0.4, 0.6, 0.6, 16]} />
                        <meshStandardMaterial color="#FAF9F6" emissive="#FFD28E" emissiveIntensity={0.6} />
                    </mesh>
                </group>
            );
        case 'plant':
            return (
                <group position={position} rotation={rotation}>
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <cylinderGeometry args={[0.4, 0.3, 0.6, 12]} />
                        <meshStandardMaterial color="#6D4C41" />
                    </mesh>
                    <mesh position={[0, 1.1, 0]} castShadow>
                        <dodecahedronGeometry args={[0.6, 0]} />
                        <meshStandardMaterial color="#388E3C" />
                    </mesh>
                </group>
            );
        case 'rug':
            return (
                <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, rotation[1]]} receiveShadow>
                    <planeGeometry args={[5, 7]} />
                    <meshStandardMaterial color="#37474F" opacity={0.6} transparent />
                </mesh>
            );
        case 'painting':
            return (
                <group position={position} rotation={rotation}>
                    <mesh castShadow>
                        <boxGeometry args={[2, 1.4, 0.1]} />
                        <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                    <mesh position={[0, 0, 0.06]}>
                        <planeGeometry args={[1.8, 1.2]} />
                        <meshStandardMaterial color="#eee" />
                    </mesh>
                </group>
            );
        case 'bookshelf':
            return (
                <group position={position} rotation={rotation}>
                    <mesh castShadow>
                        <boxGeometry args={[1.5, 2.5, 0.5]} />
                        <meshStandardMaterial color="#4E342E" />
                    </mesh>
                    {[0.8, 0, -0.8].map((y, i) => (
                        <mesh key={i} position={[0, y, 0.3]} castShadow>
                            <boxGeometry args={[1.2, 0.1, 0.3]} />
                            <meshStandardMaterial color="#3E2723" />
                        </mesh>
                    ))}
                </group>
            );
        default: return null;
    }
};

// Sub-component: Room Annotation (Hotspot)
const Annotation = ({ hotspot, onSelect }: { hotspot: Hotspot, onSelect: (h: Hotspot) => void }) => {
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    return (
        <Html position={hotspot.position} center distanceFactor={10}>
            <div
                className={`hotspot-marker ${hovered ? 'active' : ''}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => onSelect(hotspot)}
            >
                <div className="hotspot-pin">
                    <i className="bi bi-geo-alt-fill text-white"></i>
                </div>
                {hovered && (
                    <div className="hotspot-label animate__animated animate__fadeInUp">
                        <div className="fw-bold mb-1">{hotspot.name}</div>
                        <div className="text-primary small fw-bold">₹{hotspot.price}</div>
                        <div className="text-muted extra-small">{hotspot.area}</div>
                    </div>
                )}
            </div>
            <style jsx>{`
                .hotspot-marker {
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .hotspot-pin {
                    width: 32px;
                    height: 32px;
                    background: #0d6efd;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(13, 110, 253, 0.4);
                }
                .hotspot-pin i {
                    transform: rotate(45deg);
                    font-size: 14px;
                }
                .hotspot-label {
                    position: absolute;
                    bottom: 45px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    padding: 10px 15px;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    min-width: 140px;
                    text-align: center;
                }
                .extra-small { font-size: 10px; }
            `}</style>
        </Html>
    );
};

// Sub-component: Mock Apartment Model
const MockApartment = ({ wallColor, floorType, planId }: { wallColor: string, floorType: string, planId: string }) => {
    // Layout variations based on planId
    const isPlanB = planId === 'B';
    const isPlanC = planId === 'C';

    const floorSize: [number, number] = isPlanB ? [25, 18] : isPlanC ? [28, 20] : [22, 16];
    const roomSplitX = isPlanB ? 2 : isPlanC ? -2 : -1;

    return (
        <group>
            {/* Base Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={floorSize} />
                <meshStandardMaterial
                    color={floorType === 'wood' ? '#8B4513' : floorType === 'marble' ? '#ffffff' : '#e0e0e0'}
                    roughness={0.1}
                    metalness={0.1}
                />
                {floorType === 'pattern' && (
                    <gridHelper args={[floorSize[0], floorSize[0], 0xdddddd, 0xbbbbbb]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} />
                )}
            </mesh>

            {/* EXTERIOR WALLS */}
            <group>
                <mesh position={[0, 1.5, -floorSize[1] / 2]} receiveShadow castShadow>
                    <boxGeometry args={[floorSize[0], 3, 0.2]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
                <mesh position={[0, 1.5, floorSize[1] / 2]} receiveShadow castShadow>
                    <boxGeometry args={[floorSize[0], 3, 0.2]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
                <mesh position={[-floorSize[0] / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[floorSize[1], 3, 0.2]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
                <mesh position={[floorSize[0] / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                    <boxGeometry args={[floorSize[1], 3, 0.2]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
            </group>

            {/* INTERNAL PARTITIONS */}

            {/* Main Hall Split */}
            <mesh position={[roomSplitX, 1.5, -floorSize[1] / 4]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[floorSize[1] / 2, 3, 0.1]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Kitchen side Partition */}
            <mesh position={[floorSize[0] / 4, 1.5, -floorSize[1] / 4]} receiveShadow castShadow>
                <boxGeometry args={[floorSize[0] / 2, 3, 0.1]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Bedroom side Partition */}
            <mesh position={[0, 1.5, floorSize[1] / 4]} receiveShadow castShadow>
                <boxGeometry args={[floorSize[0], 3, 0.1]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* FURNITURE & ACCESSORIES */}

            {/* Hallway / Living Area */}
            <group position={[-floorSize[0] / 4, 0, -floorSize[1] / 5]}>
                {/* Sofa Complex */}
                <group position={[0, 0.3, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[4, 0.6, 1.8]} />
                        <meshStandardMaterial color="#37474F" />
                    </mesh>
                    <mesh position={[0, 0.6, -0.75]} castShadow>
                        <boxGeometry args={[4, 1, 0.3]} />
                        <meshStandardMaterial color="#37474F" />
                    </mesh>
                    <mesh position={[-1.9, 0.6, 0]} castShadow>
                        <boxGeometry args={[0.2, 0.8, 1.8]} />
                        <meshStandardMaterial color="#37474F" />
                    </mesh>
                    <mesh position={[1.9, 0.6, 0]} castShadow>
                        <boxGeometry args={[0.2, 0.8, 1.8]} />
                        <meshStandardMaterial color="#37474F" />
                    </mesh>
                </group>
                <Accessory type="lamp" position={[2.5, 0, -1]} />
                <Accessory type="painting" position={[0, 2.2, -floorSize[1] / 4 + 0.5]} />
                <Accessory type="rug" position={[0, 0, 1]} />
            </group>

            {/* Kitchen Area */}
            <group position={[floorSize[0] / 4, 0, -floorSize[1] / 3]}>
                <mesh position={[0, 0.8, -1.5]} castShadow>
                    <boxGeometry args={[6, 1.6, 1]} />
                    <meshStandardMaterial color="#fafafa" />
                </mesh>
                <Accessory type="plant" position={[2.5, 0, -0.5]} />
            </group>

            {/* Main Bedroom */}
            <group position={[0, 0, floorSize[1] / 3]}>
                <group position={[0, 0.5, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[isPlanB ? 7 : 5, 1, 4]} />
                        <meshStandardMaterial color="#eee" />
                    </mesh>
                    <mesh position={[0, 0.8, -1.9]} castShadow>
                        <boxGeometry args={[isPlanB ? 7 : 5, 0.8, 0.2]} />
                        <meshStandardMaterial color="#90A4AE" />
                    </mesh>
                </group>
                <Accessory type="bookshelf" position={[-8, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
            </group>

            {/* Bonus Space for Plan C (Office) */}
            {isPlanC && (
                <group position={[floorSize[0] / 3, 0, floorSize[1] / 4]}>
                    <mesh position={[0, 0.75, 0]} castShadow>
                        <boxGeometry args={[3, 0.1, 1.5]} />
                        <meshStandardMaterial color="#4E342E" />
                    </mesh>
                    <mesh position={[0, 0.35, -0.6]} castShadow>
                        <boxGeometry args={[3, 0.7, 0.1]} />
                        <meshStandardMaterial color="#4E342E" />
                    </mesh>
                    <Text position={[0, 2, 0]} fontSize={0.3} color="white" anchorX="center">Executive Office</Text>
                </group>
            )}

        </group>
    );
};

export default function PropertyTour({ propertyId, data }: PropertyTourProps) {
    const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
    const [wallColor, setWallColor] = useState('#ffffff');
    const [floorType, setFloorType] = useState('marble');
    const [planId, setPlanId] = useState<'A' | 'B' | 'C'>('A');
    const [isDay, setIsDay] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 992);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Dynamic Hotspots based on Plan
    const hotspotsConfig: Record<string, Hotspot[]> = {
        'A': [
            { id: '1', name: 'Plan A Hall', description: 'Standard layout hall.', position: [-5, 2, -2], price: '12,50,000', area: '220 sq.ft' },
            { id: '2', name: 'Master Suite', description: 'Cosy bedroom.', position: [0, 2, 5], price: '18,50,000', area: '280 sq.ft' },
        ],
        'B': [
            { id: '1', name: 'Open Living', description: 'Expanded open hall.', position: [-6, 2, -3], price: '14,00,000', area: '310 sq.ft' },
            { id: '2', name: 'Grand Bedroom', description: 'King size suite.', position: [2, 2, 4], price: '22,00,000', area: '340 sq.ft' },
        ],
        'C': [
            { id: '1', name: 'Executive Lounge', description: 'L-shape luxury hall.', position: [-7, 2, -2], price: '16,50,000', area: '380 sq.ft' },
            { id: '2', name: 'Office Pod', description: 'Quiet work space.', position: [8, 2, 4], price: '5,00,000', area: '90 sq.ft' },
            { id: '3', name: 'Sky Suite', description: 'Massive bedroom.', position: [-2, 2, 5], price: '25,00,000', area: '420 sq.ft' },
        ]
    };

    const hotspots = hotspotsConfig[planId];

    return (
        <div className={`tour-wrapper bg-dark shadow-lg overflow-hidden position-relative ${isMobile ? 'mobile-tour' : ''}`}>
            {/* UI: Header */}
            <div className="tour-header position-absolute top-0 start-0 end-0 p-3 p-md-4 d-flex justify-content-between align-items-center z-index-10">
                <div className="glass-panel text-white p-2 px-3 px-md-4 rounded-4 d-flex align-items-center">
                    <div className="me-2 me-md-3">
                        <i className="bi bi-house-fill fs-5 fs-md-4 text-primary"></i>
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold small-mobile">3D Property Tour</h6>
                        <small className="opacity-75 d-none d-md-block">Next.js & Three.js Demo</small>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    {isMobile && (
                        <button className="btn-icon-glass" onClick={() => setSidebarVisible(!sidebarVisible)}>
                            <i className={`bi ${sidebarVisible ? 'bi-x-lg' : 'bi-sliders'}`}></i>
                        </button>
                    )}
                    <button className="btn-icon-glass d-none d-md-flex"><i className="bi bi-rss"></i></button>
                    <button className="btn-icon-glass d-none d-md-flex"><i className="bi bi-eye"></i></button>
                    <button className="btn-icon-glass d-none d-md-flex"><i className="bi bi-gear"></i></button>
                </div>
            </div>

            {/* UI: Left Sidebar (Info & Customize) */}
            <div className={`tour-sidebar-left position-absolute top-0 bottom-0 start-0 p-3 p-md-4 z-index-10 d-flex flex-column gap-3 mt-5 pt-5 ${isMobile && !sidebarVisible ? 'd-none' : ''}`} style={{ width: isMobile ? '100%' : '280px', backgroundColor: isMobile ? 'rgba(0,0,0,0.8)' : 'transparent', backdropFilter: isMobile ? 'blur(10px)' : 'none' }}>
                <div className="glass-card p-3 p-md-4 rounded-4 animate__animated animate__fadeInLeft overflow-auto">
                    <h6 className="fw-bold mb-3">Apartment Info</h6>
                    <ul className="list-unstyled mb-0 small opacity-90">
                        <li className="mb-2"><strong>Plan Type:</strong> Plan {planId} - {planId === 'A' ? 'Classic' : planId === 'B' ? 'Studio' : 'Executive'}</li>
                        <li className="mb-2"><strong>ID:</strong> {propertyId.substring(0, 8).toUpperCase()}</li>
                        <li className="mb-2"><strong>Total Area:</strong> {planId === 'A' ? '1,240' : planId === 'B' ? '1,560' : '1,980'} sq.ft</li>
                        <li><strong>Price:</strong> ₹{planId === 'A' ? '1.25' : planId === 'B' ? '1.55' : '1.95'} Cr</li>
                    </ul>
                </div>

                <div className="glass-card p-3 p-md-4 rounded-4 animate__animated animate__fadeInLeft" style={{ animationDelay: '0.2s' }}>
                    <h6 className="fw-bold mb-3">Customize</h6>
                    <div className="mb-3">
                        <label className="extra-small opacity-75 d-block mb-2">Wall Color</label>
                        <div className="d-flex gap-2 flex-wrap">
                            {['#ffffff', '#F5E6CC', '#D2B48C', '#b4b4b4', '#e5d9d2'].map(c => (
                                <div
                                    key={c}
                                    className={`color-dot ${wallColor === c ? 'active' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setWallColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="extra-small opacity-75 d-block mb-2">Floor Type</label>
                        <div className="d-flex gap-2">
                            <div
                                className={`floor-card ${floorType === 'marble' ? 'active' : ''}`}
                                onClick={() => setFloorType('marble')}
                            >
                                <div className="floor-preview marble"></div>
                                <span>Marble</span>
                            </div>
                            <div
                                className={`floor-card ${floorType === 'wood' ? 'active' : ''}`}
                                onClick={() => setFloorType('wood')}
                            >
                                <div className="floor-preview wood"></div>
                                <span>Wood</span>
                            </div>
                            <div
                                className={`floor-card ${floorType === 'pattern' ? 'active' : ''}`}
                                onClick={() => setFloorType('pattern')}
                            >
                                <div className="floor-preview pattern-bg"></div>
                                <span>Mosaic</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Selection Card */}
                <div className="glass-card p-3 p-md-4 rounded-4 animate__animated animate__fadeInLeft" style={{ animationDelay: '0.4s' }}>
                    <h6 className="fw-bold mb-3">Select Floor Plan</h6>
                    <div className="d-grid gap-2">
                        {(['A', 'B', 'C'] as const).map(p => (
                            <button
                                key={p}
                                className={`btn btn-sm ${planId === p ? 'btn-primary' : 'btn-outline-light'} rounded-4`}
                                onClick={() => setPlanId(p)}
                            >
                                Plan {p} - {p === 'A' ? 'Classic' : p === 'B' ? 'Studio' : 'Executive'}
                            </button>
                        ))}
                    </div>
                    {isMobile && (
                        <button className="btn btn-light btn-sm w-100 mt-3 rounded-4 fw-bold" onClick={() => setSidebarVisible(false)}>
                            Apply Changes
                        </button>
                    )}
                </div>
            </div>

            {/* UI: Right Sidebar (Details) */}
            {selectedHotspot && (
                <div className={`tour-sidebar-right position-absolute top-0 bottom-0 end-0 p-3 p-md-4 z-index-10 d-flex flex-column gap-3 mt-5 pt-5 ${isMobile ? 'start-0' : ''}`} style={{ width: isMobile ? '100%' : '320px', backgroundColor: isMobile ? 'rgba(0,0,0,0.8)' : 'transparent', backdropFilter: isMobile ? 'blur(10px)' : 'none' }}>
                    <div className="glass-card p-3 p-md-4 rounded-4 animate__animated animate__fadeInRight">
                        <div className="d-flex justify-content-between mb-3">
                            <h6 className="fw-bold mb-0">{selectedHotspot.name} Details</h6>
                            <button className="btn-close btn-close-white btn-sm" onClick={() => setSelectedHotspot(null)}></button>
                        </div>
                        <ul className="list-unstyled mb-4 small opacity-90">
                            <li className="mb-2 d-flex justify-content-between">
                                <span>Area:</span>
                                <strong>{selectedHotspot.area}</strong>
                            </li>
                            <li className="mb-2 d-flex justify-content-between">
                                <span>Price:</span>
                                <strong>₹{selectedHotspot.price}</strong>
                            </li>
                            <li className="mb-3 mt-3 text-muted">{selectedHotspot.description}</li>
                        </ul>

                        <div className="d-grid gap-2">
                            <button className="btn btn-outline-light btn-sm rounded-4">More Photos</button>
                            <button className="btn btn-primary rounded-4 px-4 shadow">
                                Schedule a Visit <i className="bi bi-chevron-right ms-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UI: Bottom Toolbar */}
            <div className={`tour-toolbar position-absolute bottom-0 start-50 translate-middle-x p-3 p-md-4 z-index-10 w-100 d-flex justify-content-center ${isMobile && (sidebarVisible || selectedHotspot) ? 'd-none' : ''}`}>
                <div className="glass-toolbar p-2 rounded-4 d-flex gap-1 animate__animated animate__fadeInUp overflow-auto no-scrollbar" style={{ maxWidth: '90vw' }}>
                    <button className={`btn-tool-pill ${isDay ? 'active' : ''}`} onClick={() => setIsDay(!isDay)}>
                        <i className={`bi bi-${isDay ? 'sun' : 'moon-stars'} me-2`}></i> {isDay ? 'Day' : 'Night'}
                    </button>
                    <button className="btn-tool-pill"><i className="bi bi-layers me-2"></i> Plan</button>
                    <button className="btn-tool-pill"><i className="bi bi-arrow-repeat me-2"></i> 360°</button>
                    <button className="btn-tool-pill"><i className="bi bi-chat-dots me-2"></i> Chat</button>
                </div>
            </div>

            {/* Canvas: 3D Scene */}
            <div className="tour-canvas" style={{ flex: 1, height: isMobile ? '500px' : '700px' }}>
                <Canvas shadows gl={{ antialias: true }}>
                    <Suspense fallback={<Html center><Loader size="md" message="Loading Scene Components..." /></Html>}>
                        <PerspectiveCamera makeDefault position={isMobile ? [20, 15, 20] : [15, 12, 15]} fov={isMobile ? 50 : 45} />
                        <OrbitControls
                            enablePan={false}
                            minDistance={5}
                            maxDistance={isMobile ? 45 : 35}
                            maxPolarAngle={Math.PI / 2.1}
                        />

                        {/* Lights */}
                        <ambientLight intensity={isDay ? 0.8 : 0.2} />
                        <pointLight position={[0, 5, 0]} intensity={isDay ? 0 : 2} color="#ffccaa" />
                        <directionalLight
                            position={[10, 10, 5]}
                            intensity={isDay ? 1.5 : 0.1}
                            castShadow
                            shadow-mapSize={[1024, 1024]}
                        />
                        <Environment preset={isDay ? "apartment" : "night"} />

                        {/* Scene Content */}
                        <MockApartment wallColor={wallColor} floorType={floorType} planId={planId} />

                        {/* Hotspots */}
                        {hotspots.map(h => (
                            <Annotation key={h.id} hotspot={h} onSelect={setSelectedHotspot} />
                        ))}

                        <ContactShadows position={[0, -0.1, 0]} opacity={0.4} scale={30} blur={2} />
                    </Suspense>
                </Canvas>
            </div>

            <style jsx>{`
                .tour-wrapper {
                    height: 800px;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                }
                .tour-wrapper.mobile-tour {
                    height: 600px;
                    border-radius: 16px;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3);
                    color: white;
                }
                .glass-toolbar {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .btn-icon-glass {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }
                .btn-icon-glass:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-2px);
                }
                .color-dot {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.1);
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .color-dot.active {
                    transform: scale(1.2);
                    border-color: #0d6efd;
                }
                .floor-card {
                    flex: 1;
                    padding: 5px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    cursor: pointer;
                    text-align: center;
                    font-size: 10px;
                }
                .floor-card.active {
                    border-color: #0d6efd;
                    background: rgba(13, 110, 253, 0.15);
                }
                .floor-preview {
                    height: 30px;
                    border-radius: 4px;
                    margin-bottom: 4px;
                }
                .floor-preview.marble { background: #e0e0e0; }
                .floor-preview.wood { background: #8B4513; }
                .floor-preview.pattern-bg { 
                    background-image: 
                        linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%);
                    background-size: 10px 10px;
                    background-position: 0 0, 0 5px, 5px 5px, 5px 0;
                    background-color: white;
                }
                
                .btn-tool-pill {
                    padding: 8px 20px;
                    border-radius: 100px;
                    border: none;
                    background: transparent;
                    color: white;
                    font-size: 12px;
                    white-space: nowrap;
                    transition: all 0.3s;
                }
                .btn-tool-pill:hover, .btn-tool-pill.active {
                    background: rgba(255, 255, 255, 0.1);
                }
                .z-index-10 { z-index: 10; }
                
                @media (max-width: 768px) {
                    .small-mobile { font-size: 14px; }
                    .btn-icon-glass { width: 36px; height: 36px; }
                    .tour-wrapper { height: 600px; }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                }
            `}</style>
        </div>
    );
}
