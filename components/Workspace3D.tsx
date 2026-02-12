'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Seats } from '@/types';

interface Workspace3DProps {
  workspaces: Seats[];
  onWorkspaceClick?: (seats: Seats) => void;
  onShowDemoPlans?: (seats: Seats) => void;
  layout?: any[];
  config?: any;
}

export default function Workspace3D({ workspaces, onWorkspaceClick, onShowDemoPlans, layout, config }: Workspace3DProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Seats | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [threeJSLoaded, setThreeJSLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomValue, setZoomValue] = useState(25);

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
  const cameraTarget = useRef({ x: 0, y: 0, z: 0 });
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

    // Camera setup - Start even closer and more focused
    const initialDist = 12;
    cameraDistance.current = initialDist;
    setZoomValue(initialDist);

    const camera = new THREE.PerspectiveCamera(
      45, // Narrower FOV for less distortion
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 8, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Outdoor Atmosphere (Boosted for realism)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d6e63, 0.9);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirIntensity = config?.scene?.directionalLight || 1.2;
    const directionalLight = new THREE.DirectionalLight(0xfff5e6, dirIntensity); // Warm sunlight
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // High res shadows
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);

    // Dynamic floor size based on layout
    let minX = -40, maxX = 40, minZ = -40, maxZ = 40;
    if (layout && layout.length > 0) {
      layout.forEach(obj => {
        const x = obj.position?.x || 0;
        const z = obj.position?.z || 0;
        minX = Math.min(minX, x - 20);
        maxX = Math.max(maxX, x + 20);
        minZ = Math.min(minZ, z - 20);
        maxZ = Math.max(maxZ, z + 20);
      });
    }
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    // Invert Z target to match flipped mapping
    cameraTarget.current = { x: centerX, y: 0, z: -centerZ };

    const baseSize = Math.max(maxX - minX, maxZ - minZ, 150);
    const floorGeometry = new THREE.PlaneGeometry(baseSize, baseSize);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x9ccc65, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(centerX, -0.01, centerZ);
    floor.receiveShadow = true;
    scene.add(floor);


    // Create seats objects based on layout or defaults
    const workspaceObjects: { [key: string]: any } = {};

    if (layout && layout.length > 0) {
      layout.forEach((obj: any) => {
        let mesh: any;

        const points = obj.metadata?.polyPoints;
        const isBuilding = ['cabin', 'villa', 'house', 'apartment', 'office', 'flat', 'unit'].includes(obj.type) || obj.unitId?.includes('shape');
        const isWater = obj.type === 'river' || obj.type === 'lake';
        const isPath = obj.type === 'road' || obj.type === 'drainage';

        if (points && points.length > 0) {
          // Handle Polygon Shapes
          const shape = new THREE.Shape();
          // Invert Z here to fix 'flipped' view: Designers think Y increasing is "down" 
          // but Three.js sees Z increasing as "front". Negating Z maps Design Down to 3D Front.
          shape.moveTo(points[0].x, -points[0].z);
          for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, -points[i].z);
          }
          shape.lineTo(points[0].x, -points[0].z);

          let h = obj.dimensions?.h || (isBuilding ? 3.0 : (isWater ? 0.05 : (isPath ? 0.02 : 0.5)));

          const extrudeSettings = { depth: h, bevelEnabled: false };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const material = new THREE.MeshLambertMaterial({
            color: obj.color || (isWater ? 0x2196f3 : (isPath ? 0x424242 : 0xffffff)),
            transparent: isWater,
            opacity: isWater ? 0.7 : 1.0,
            side: THREE.DoubleSide
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          // Position at ground level - Points are absolute world coordinates
          // After rotation, depth h goes down, so we lift it by h to sit on ground
          mesh.position.set(0, h, 0);
        } else if (obj.type === 'tree') {
          // Keep Trees 3D
          mesh = new THREE.Group();
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 1.2),
            new THREE.MeshLambertMaterial({ color: 0x4e342e })
          );
          trunk.position.y = 0.6;
          const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 2.5, 8),
            new THREE.MeshLambertMaterial({ color: 0x1b5e20 })
          );
          foliage.position.y = 2.2;
          mesh.add(trunk);
          mesh.add(foliage);
          mesh.position.set(obj.position?.x || 0, 0, -(obj.position?.z || 0));
        } else if (obj.type === 'hills') {
          // Keep Hills 3D
          const geometry = new THREE.ConeGeometry(4, 5, 12);
          const material = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(obj.position?.x || 0, 2.5, -(obj.position?.z || 0));
        } else if (obj.type === 'court') {
          // Sports Court (Tennis/Basketball)
          const geometry = new THREE.BoxGeometry(obj.dimensions?.w || 12, 0.1, obj.dimensions?.d || 20);
          const material = new THREE.MeshLambertMaterial({ color: 0x4caf50 }); // Professional Green
          mesh = new THREE.Mesh(geometry, material);

          // Add white lines for the court
          const lineGeo = new THREE.PlaneGeometry((obj.dimensions?.w || 12) * 0.9, (obj.dimensions?.d || 20) * 0.9);
          const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
          const lines = new THREE.Mesh(lineGeo, lineMat);
          lines.rotation.x = -Math.PI / 2;
          lines.position.y = 0.06;
          mesh.add(lines);

          mesh.position.set(obj.position?.x || 0, 0.05, -(obj.position?.z || 0));
        } else if (obj.type === 'pond') {
          // Lily Pond / Water
          const geometry = new THREE.CylinderGeometry(obj.dimensions?.w || 5, obj.dimensions?.w || 5, 0.2, 32);
          const material = new THREE.MeshPhongMaterial({
            color: 0x03a9f4,
            transparent: true,
            opacity: 0.7,
            shininess: 100
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(obj.position?.x || 0, 0.1, -(obj.position?.z || 0));
        } else if (obj.type === 'arch') {
          // Entrance Arch
          mesh = new THREE.Group();
          const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
          pillar1.position.set(-2, 2, 0);
          const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
          pillar2.position.set(2, 2, 0);
          const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 1.2), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
          top.position.set(0, 4, 0);
          mesh.add(pillar1);
          mesh.add(pillar2);
          mesh.add(top);
          mesh.position.set(obj.position?.x || 0, 0, -(obj.position?.z || 0));
        } else {
          // Modern Architecture - Rectangular Plots / Villas / Clubhouse
          let h = obj.dimensions?.h || 0.5;
          const isComplex = ['villa', 'clubhouse', 'house'].includes(obj.type);

          if (isComplex) {
            h = obj.dimensions?.h || 4.5;
            mesh = new THREE.Group();

            // Main Body
            const body = new THREE.Mesh(
              new THREE.BoxGeometry(obj.dimensions?.w || 4, h, obj.dimensions?.d || 6),
              new THREE.MeshLambertMaterial({ color: obj.color || 0xffffff })
            );
            body.position.y = h / 2;
            mesh.add(body);

            // Flat Roof with overhang
            const roof = new THREE.Mesh(
              new THREE.BoxGeometry((obj.dimensions?.w || 4) + 0.5, 0.2, (obj.dimensions?.d || 6) + 0.5),
              new THREE.MeshLambertMaterial({ color: 0x424242 })
            );
            roof.position.y = h;
            mesh.add(roof);

            // Balcony/Protrusion
            const balcony = new THREE.Mesh(
              new THREE.BoxGeometry((obj.dimensions?.w || 4) + 0.2, h * 0.4, 1.5),
              new THREE.MeshLambertMaterial({ color: 0xffffff })
            );
            balcony.position.set(0, h * 0.7, (obj.dimensions?.d || 6) / 2);
            mesh.add(balcony);

          } else {
            const geometry = new THREE.BoxGeometry(obj.dimensions?.w || 1, h, obj.dimensions?.d || 1);
            const material = new THREE.MeshLambertMaterial({ color: obj.color || 0x3182ce });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(obj.position?.x || 0, h / 2, -(obj.position?.z || 0));
          }

          if (obj.rotation?.y) {
            mesh.rotation.y = -(obj.rotation.y * Math.PI) / 180;
          }
          if (isComplex) {
            mesh.position.set(obj.position?.x || 0, 0, -(obj.position?.z || 0));
          }
        }

        if (mesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { type: obj.type, id: obj.unitId || obj.id };
          scene.add(mesh);
          workspaceObjects[obj.unitId || obj.id] = mesh;
        }
      });
    } else {
      // Default Empty Plot state
      const box = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 5), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
      box.position.y = 0.05;
      scene.add(box);
    }

    // Update seats colors based on status
    const updatePlotColors = () => {
      workspaces.forEach((seats) => {
        const mesh = workspaceObjects[seats.id];
        if (mesh) {
          // If the object has a custom design color, don't override it with green
          const layoutObj = layout?.find(l => (l.unitId || l.id) === seats.id);
          if (layoutObj && layoutObj.color) {
            // Only override if status is critical (sold/maintenance) or if no design color
            if (seats.status === 'available') return;
          }

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

    updatePlotColors();

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
      const newZoom = Math.max(10, Math.min(50, cameraDistance.current + event.deltaY * zoomSpeed * 0.10));
      cameraDistance.current = newZoom;
      setZoomValue(newZoom);
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
      cameraAngleY.current = Math.max(0.1, Math.min(1.5, cameraAngleY.current - deltaY * 0.10));

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
      const target = cameraTarget.current;
      camera.position.x = target.x + cameraDistance.current * Math.sin(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      camera.position.y = target.y + cameraDistance.current * Math.sin(cameraAngleY.current);
      camera.position.z = target.z + cameraDistance.current * Math.cos(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      camera.lookAt(target.x, target.y, target.z);

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
        <div className="position-absolute top-0 start-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-lg backdrop-blur" style={{ backdropFilter: 'blur(8px)' }}>
          <h6 className="mb-2 fw-bold small text-uppercase">Property Status</h6>
          <div className="d-flex align-items-center mb-1">
            <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#7cff4d' }}></div>
            <small className="extra-small">Available</small>
          </div>
          <div className="d-flex align-items-center mb-1">
            <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ff4444' }}></div>
            <small className="extra-small">Sold Out</small>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-2 rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ffaa00' }}></div>
            <small className="extra-small">Reserved</small>
          </div>
        </div>

        {/* Selected Unit Info Card */}
        {selectedWorkspace && (
          <div className="position-absolute top-0 end-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-lg backdrop-blur border border-white border-opacity-50" style={{ backdropFilter: 'blur(8px)', minWidth: '220px' }}>
            <h6 className="mb-2 fw-bold small text-uppercase text-primary border-bottom pb-2">Listing Overview</h6>
            <div className="small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Unit:</span>
                <span className="fw-bold">{selectedWorkspace.name}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Status:</span>
                <span className={`badge px-2 py-1 ${selectedWorkspace.status === 'available' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{selectedWorkspace.status.toUpperCase()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Price:</span>
                <span className="fw-bold text-primary">${selectedWorkspace.monthlyRate || selectedWorkspace.price || selectedWorkspace.hourlyRate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls Overlay */}
        <div className="position-absolute bottom-0 start-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-sm backdrop-blur" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="text-center"><i className="bi bi-mouse2 h5 d-block mb-1"></i><small className="extra-small text-muted">Rotate</small></div>
            <div className="text-center"><i className="bi bi-mouse h5 d-block mb-1"></i><small className="extra-small text-muted">Zoom</small></div>
            <div className="text-center"><i className="bi bi-cursor h5 d-block mb-1"></i><small className="extra-small text-muted">Select</small></div>
          </div>
        </div>

        {/* Zoom Slider Overlay */}
        <div className="position-absolute bottom-0 end-0 m-3 bg-white bg-opacity-75 p-3 rounded-4 shadow-sm backdrop-blur" style={{ backdropFilter: 'blur(8px)', width: '180px' }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="extra-small fw-bold text-uppercase text-muted">Zoom Level</small>
            <span className="badge bg-primary extra-small">{Math.round(((50 - zoomValue) / 40) * 100)}%</span>
          </div>
          <input
            type="range"
            className="form-range"
            min="10"
            max="50"
            step="0.1"
            value={zoomValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setZoomValue(val);
              cameraDistance.current = val;
            }}
          />
          <div className="d-flex justify-content-between mt-1">
            <i className="bi bi-zoom-out extra-small text-muted"></i>
            <i className="bi bi-zoom-in extra-small text-muted"></i>
          </div>
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

              <div className="row g-2 mb-3">
                <div className="col-6 bg-light p-2 rounded-3 text-center">
                  <div className="extra-small text-muted text-uppercase mb-1">Bedrooms</div>
                  <div className="fw-bold">{selectedWorkspace.bedrooms || '-'}</div>
                </div>
                <div className="col-6 bg-light p-2 rounded-3 text-center">
                  <div className="extra-small text-muted text-uppercase mb-1">Size (Sqft)</div>
                  <div className="fw-bold">{selectedWorkspace.sizeSqft || '-'}</div>
                </div>
              </div>

              <div className="mb-3">
                <strong>Premium Features:</strong>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {selectedWorkspace.features.length > 0 ? selectedWorkspace.features.slice(0, 4).map(feature => (
                    <span key={feature} className="badge bg-white text-dark border extra-small px-2 py-1">
                      {feature}
                    </span>
                  )) : <span className="text-muted extra-small">Standard Amenities Included</span>}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <div>
                  <span className="extra-small text-muted text-uppercase d-block">Asking Price</span>
                  <span className="h5 fw-bold text-primary mb-0">${selectedWorkspace.monthlyRate || selectedWorkspace.price || selectedWorkspace.hourlyRate}</span>
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

              {onShowDemoPlans && (
                <button
                  className="btn btn-sm btn-outline-info w-100 mt-2 rounded-4 fw-bold"
                  onClick={() => onShowDemoPlans(selectedWorkspace)}
                >
                  <i className="bi bi-house-door me-2"></i>
                  Demo House Plan
                </button>
              )}
            </div>
          </div>
        )}
      </div >
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
