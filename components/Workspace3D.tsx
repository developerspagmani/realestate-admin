'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Seats } from '@/types';

interface Workspace3DProps {
  workspaces: Seats[];
  onWorkspaceClick?: (seats: Seats) => void;
  layout?: any[];
  config?: any;
}

export default function Workspace3D({ workspaces, onWorkspaceClick, layout, config }: Workspace3DProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Seats | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [threeJSLoaded, setThreeJSLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Camera control state
  const cameraDistance = useRef(25);
  const cameraAngleX = useRef(0);
  const cameraAngleY = useRef(0.5);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const handleWorkspaceClick = useCallback((seats: Seats) => {
    setSelectedWorkspace(seats);
    if (onWorkspaceClick) {
      onWorkspaceClick(seats);
    }
  }, [onWorkspaceClick]);

  const handleWorkspacePopup = useCallback((seats: Seats, event: MouseEvent) => {
    setSelectedWorkspace(seats);
    setShowPopup(true);
    setPopupPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  useEffect(() => {
    // Try to dynamically import Three.js
    const loadThreeJS = async () => {
      try {
        const THREE = await import('three');
        setThreeJSLoaded(true);
        // Wait a tick for the component to fully render
        setTimeout(() => {
          const cleanup = initializeScene(THREE);
          if (cleanup) {
            cleanupRef.current = cleanup;
          }
        }, 100); // Increased timeout to ensure mount ref is available
      } catch (err) {
        console.error('Three.js loading error:', err);
        setError('Three.js not installed. Please run: npm install three @types/three');
      }
    };

    loadThreeJS();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Reset states for re-initialization
      setThreeJSLoaded(false);
      setError(null);
    };
  }, [workspaces]);

  const initializeScene = (THREE: any): (() => void) | undefined => {
    console.log('Initializing 3D scene...');

    // Retry logic for mount ref availability
    const retryInitialization = (attempt: number = 0): (() => void) | undefined => {
      if (!mountRef.current) {
        console.error(`Mount ref not available, attempt ${attempt + 1}`);
        if (attempt < 5) {
          setTimeout(() => retryInitialization(attempt + 1), 100);
          return;
        } else {
          console.error('Mount ref not available after 5 attempts');
          return;
        }
      }

      console.log('Mount ref available, creating scene...');
      return createThreeScene(THREE);
    };

    return retryInitialization();
  };

  const createThreeScene = (THREE: any): (() => void) | undefined => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const bgColor = config?.scene?.background || 0xf0f0f0;
    scene.background = new THREE.Color(bgColor);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambIntensity = config?.scene?.ambientLight || 0.6;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambIntensity);
    scene.add(ambientLight);

    const dirIntensity = config?.scene?.directionalLight || 0.8;
    const directionalLight = new THREE.DirectionalLight(0xffffff, dirIntensity);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.BoxGeometry(30, 0.5, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create seats objects based on layout or defaults
    const workspaceObjects: { [key: string]: any } = {};

    if (layout && layout.length > 0) {
      layout.forEach((obj: any) => {
        const geometry = new THREE.BoxGeometry(obj.dimensions?.w || 1, obj.dimensions?.h || 1, obj.dimensions?.d || 1);
        const material = new THREE.MeshLambertMaterial({ color: obj.color || 0x7cff4d });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(obj.position?.x || 0, obj.position?.y || 0.5, obj.position?.z || 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: obj.type, id: obj.unitId || obj.id };
        scene.add(mesh);
        workspaceObjects[obj.unitId || obj.id] = mesh;
      });
    } else {
      // Cabins (larger 3D boxes) - Original Demo Fallback
      const cabinPositions = [
        { x: -10, z: -6 }, { x: -5, z: -6 }, { x: 0, z: -6 },
        { x: 5, z: -6 }, { x: 10, z: -6 }
      ];

      cabinPositions.forEach((pos, index) => {
        const cabinGeometry = new THREE.BoxGeometry(3, 2, 2.5);
        const cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x3399ff });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(pos.x, 1, pos.z);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        cabin.userData = { type: 'cabin', id: `cabin-${String(index + 1).padStart(2, '0')}` };
        scene.add(cabin);
        workspaceObjects[`cabin-${String(index + 1).padStart(2, '0')}`] = cabin;
      });

      // Seats (smaller 3D boxes) - Original Demo Fallback
      const seatPositions = [
        { x: -10, z: 2 }, { x: -8, z: 2 }, { x: -6, z: 2 }, { x: -4, z: 2 }, { x: -2, z: 2 },
        { x: -10, z: 4 }, { x: -8, z: 4 }, { x: -6, z: 4 }, { x: -4, z: 4 }, { x: -2, z: 4 }
      ];

      seatPositions.forEach((pos, index) => {
        const seatGeometry = new THREE.BoxGeometry(1, 1, 1);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x7cff4d });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(pos.x, 0.5, pos.z);
        seat.castShadow = true;
        seat.receiveShadow = true;
        seat.userData = { type: 'seat', id: `seat-${String(index + 1).padStart(2, '0')}` };
        scene.add(seat);
        workspaceObjects[`seat-${String(index + 1).padStart(2, '0')}`] = seat;
      });
    }

    // Update seats colors based on status
    const updateWorkspaceColors = () => {
      workspaces.forEach((seats) => {
        const mesh = workspaceObjects[seats.id];
        if (mesh) {
          let color: number;
          switch (seats.status) {
            case 'available':
              color = 0x7cff4d; // Green
              break;
            case 'occupied':
              color = 0xff4444; // Red
              break;
            case 'maintenance':
              color = 0xffaa00; // Orange
              break;
            default:
              color = 0x7cff4d; // Default green
          }
          (mesh.material as any).color.setHex(color);
        }
      });
    };

    updateWorkspaceColors();

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(workspaceObjects));

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const workspaceId = clickedObject.userData.id;
        const seats = workspaces.find(w => w.id === workspaceId);

        if (seats) {
          // Show popup instead of directly calling onWorkspaceClick
          handleWorkspacePopup(seats, event);
        }
      }
    };

    // Mouse wheel zoom
    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      cameraDistance.current = Math.max(10, Math.min(50, cameraDistance.current + event.deltaY * zoomSpeed * 0.01));
    };

    // Mouse drag rotation
    const onMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - previousMousePosition.current.x;
      const deltaY = event.clientY - previousMousePosition.current.y;

      cameraAngleX.current += deltaX * 0.01;
      cameraAngleY.current = Math.max(0.1, Math.min(1.5, cameraAngleY.current - deltaY * 0.01));

      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    // Touch controls for mobile
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isDragging.current || event.touches.length !== 1) return;
      event.preventDefault();

      const deltaX = event.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = event.touches[0].clientY - previousMousePosition.current.y;

      cameraAngleX.current += deltaX * 0.01;
      cameraAngleY.current = Math.max(0.1, Math.min(1.5, cameraAngleY.current - deltaY * 0.01));

      previousMousePosition.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging.current = false;
    };

    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('wheel', onMouseWheel);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update camera position based on user controls
      camera.position.x = cameraDistance.current * Math.sin(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      camera.position.y = cameraDistance.current * Math.sin(cameraAngleY.current);
      camera.position.z = cameraDistance.current * Math.cos(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    const cleanup = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (mountRef.current && renderer?.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('click', onMouseClick);
      renderer.domElement.removeEventListener('wheel', onMouseWheel);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };

    return cleanup;
  };

  // Fallback 2D view if Three.js is not available or 3D fails
  if (!threeJSLoaded && !error) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '700px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading 3D view...</span>
          </div>
          <p className="text-muted">Loading 3D seats visualization...</p>
        </div>
      </div>
    );
  }

  // Show 3D view if loaded and no error
  if (threeJSLoaded && !error) {
    return (
      <div className="position-relative">
        <div ref={mountRef} style={{ width: '100%', height: '700px' }} />

        {/* Legend */}
        <div className="position-absolute top-0 start-0 m-3 bg-white p-3 rounded shadow">
          <h6 className="mb-2">Availability</h6>
          <div className="d-flex align-items-center mb-1">
            <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#7cff4d' }}></div>
            <small>Available</small>
          </div>
          <div className="d-flex align-items-center mb-1">
            <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#ff4444' }}></div>
            <small>Occupied</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#ffaa00' }}></div>
            <small>Maintenance</small>
          </div>
        </div>

        {/* Selected seats info */}
        {selectedWorkspace && (
          <div className="position-absolute top-0 end-0 m-3 bg-white p-3 rounded shadow">
            <h6 className="mb-2">Unit Info</h6>
            <div className="small">
              <strong>{selectedWorkspace.name}</strong><br />
              Type: {selectedWorkspace.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}<br />
              Status: {selectedWorkspace.status}<br />
              Price: ${selectedWorkspace.hourlyRate}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="position-absolute bottom-0 start-0 m-3 bg-white p-2 rounded shadow">
          <small className="text-muted">
            <strong>Controls:</strong><br />
            🖱️ Drag to rotate | 🎡 Scroll to zoom | 👆 Click to select
          </small>
        </div>

        {/* Seats Popup */}
        {showPopup && selectedWorkspace && mountRef.current && (
          <div
            className="position-absolute bg-white rounded shadow-lg p-3"
            style={{
              left: `${Math.min(popupPosition.x - mountRef.current.getBoundingClientRect().left, window.innerWidth - 320)}px`,
              top: `${Math.min(popupPosition.y - mountRef.current.getBoundingClientRect().top, window.innerHeight - 200)}px`,
              minWidth: '300px',
              maxWidth: '350px',
              zIndex: 1000
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0 fw-bold">{selectedWorkspace.name}</h6>
              <button
                type="button"
                className="btn-close btn-sm"
                onClick={closePopup}
              ></button>
            </div>

            <div className="small">
              <div className="mb-2">
                <span className="badge bg-primary me-2">
                  {selectedWorkspace.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`badge ${selectedWorkspace.status === 'available' ? 'bg-success' :
                  selectedWorkspace.status === 'occupied' ? 'bg-danger' : 'bg-warning'
                  }`}>
                  {selectedWorkspace.status}
                </span>
              </div>

              <div className="mb-2">
                <strong>Capacity:</strong> {selectedWorkspace.capacity} people
              </div>

              <div className="mb-2">
                <strong>Features:</strong>
                <ul className="list-unstyled mt-1 mb-0">
                  {selectedWorkspace.features.slice(0, 3).map(feature => (
                    <li key={feature} className="small text-muted">
                      <i className="bi bi-check-circle text-success me-1"></i>
                      {feature}
                    </li>
                  ))}
                  {selectedWorkspace.features.length > 3 && (
                    <li className="small text-muted">+{selectedWorkspace.features.length - 3} more</li>
                  )}
                </ul>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Price:</strong><br />
                  <span className="text-primary">${selectedWorkspace.hourlyRate}</span>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    handleWorkspaceClick(selectedWorkspace);
                    closePopup();
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">
          <h5>3D View Unavailable</h5>
          <p>{error}</p>
          <div className="mt-3">
            <h6>2D Seats Overview</h6>
            <div className="row">
              {workspaces.filter(w => w.id.startsWith('cabin-')).map(seats => (
                <div key={seats.id} className="col-md-4 mb-3">
                  <div
                    className={`card cursor-pointer ${selectedWorkspace?.id === seats.id ? 'border-primary' : ''}`}
                    onClick={() => handleWorkspaceClick(seats)}
                  >
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2 rounded"
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: seats.status === 'available' ? '#7cff4d' :
                              seats.status === 'occupied' ? '#ff4444' : '#ffaa00'
                          }}
                        ></div>
                        <div>
                          <small className="fw-bold">{seats.name}</small><br />
                          <small className="text-muted">{seats.status}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row mt-3">
              {workspaces.filter(w => w.id.startsWith('seat-')).map(seats => (
                <div key={seats.id} className="col-md-2 mb-2">
                  <div
                    className={`card cursor-pointer ${selectedWorkspace?.id === seats.id ? 'border-primary' : ''}`}
                    onClick={() => handleWorkspaceClick(seats)}
                  >
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2 rounded"
                          style={{
                            width: '15px',
                            height: '15px',
                            backgroundColor: seats.status === 'available' ? '#7cff4d' :
                              seats.status === 'occupied' ? '#ff4444' : '#ffaa00'
                          }}
                        ></div>
                        <small>{seats.name}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
