# Implementation Plan: 3D Property Tour Module

This plan outlines the strategy to implement a premium **3D Property Tour** feature in the application, inspired by the reference "Next.js & Three.js Demo".

## 1. Core Objectives
- Create an immersive, interactive 3D showcase for real estate properties.
- Enable material customization (wall colors, flooring) in real-time.
- Provide descriptive hotspots (prices, room details) as floating UI elements.
- Maintain a high-performance, mobile-responsive experience with a "premium" glassmorphism aesthetic.

## 2. Technical Stack
- **Engine**: Three.js with `@react-three/fiber` (Standard for Next.js React integration).
- **Utilities**: `@react-three/drei` (For easy handling of Gizmos, Html overlays, GLTF loading, and Camera controls).
- **Materials**: Standard PBR (Physically Based Rendering) using GLB/GLTF assets.
- **UI Framework**: Custom React components with Glassmorphism (Backdrop-filter: blur) and Bootstrap 5.

## 3. Database Schema Extensions

To store tour-specific data, we will extend the `Property3DConfig` or create a new `PropertyTour` model:

### `PropertyTourMetaData`
- `id`: UUID
- `propertyId`: Link to Property
- `glbUrl`: String (URL to the 3D model file)
- `initialCameraPosition`: JSON ({x, y, z})
- `hotspots`: JSON Array
    - `name`: "Living Room", "Master Bedroom"
    - `position`: {x, y, z}
    - `price`: Decimal
    - `area`: String
    - `description`: String
- `customizableMaterials`: JSON Object
    - `walls`: Array of {label, hex, textureUrl}
    - `floors`: Array of {label, textureUrl}

## 4. Feature Breakdown

### A. 3D Viewer Hub
- **Responsive Container**: A fixed-height or full-screen canvas using `<Canvas>`.
- **Lighting System**: Combined Ambient, Directional, and Environment Map (HDRI) for realistic reflections.
- **Day/Night Toggle**: Scripted transition of the `environment` and `background` properties.

### B. Interactive Hotspots (Annotation System)
- Use the `<Html>` helper from `drei` to project 2D React components into 3D space.
- Hotspots will display current Room Price and SQFT from the database.
- Clicking a hotspot will animate the camera (`OrbitControls` or `CameraShake`) to focus on that specific area.

### C. Live Customization Interface
- **Raycasting**: Detect specific meshes (e.g., meshes named "Wall_01", "Floor_Main").
- **State Management**: Update Three.js materials in the render loop based on user selection in the "Customize" panel.
- **Texture Loading**: Use `useTexture` hooks to swap floor patterns (Marble vs. Wood) without reloading the scene.

### D. Information & Actions Sidebar
- **Property Info**: Static summary of the unit (BHK, ID, Total Price).
- **Room Details**: Dynamic panel that updates when a hotspot is clicked.
- **Booking Integration**: "Schedule a Visit" button linking to the existing Booking system.

## 5. Implementation Roadmap

### Phase 1: Foundation (React-Three-Fiber Setup)
- Build a generic `3DTourContainer.tsx`.
- Implement `GLTFLoader` with suspense-based loading indicator.
- Set up `OrbitControls` with boundaries (minDistance, maxPolarAngle).

### Phase 2: Data & Hotspots
- Integrate the API to fetch `hotspot` coordinates and labels.
- Implement the `<Annotation />` component using HTML overlays.
- Add "Focus Mode": Smooth transitions to specific coordinates.

### Phase 3: Customization Panel
- Implement the "Customize" UI sidebar.
- Create a Material Hook that maps selection IDs to Three.js `MeshStandardMaterial` parameters.

### Phase 4: Polish & UI
- Apply Glassmorphism CSS to all control panels.
- Implement "Day/Night" lighting cycles.
- Optimize assets (Texture compression via KTX2 or Basis Universal).

---
**Status**: Planning Only
**Reference**: Next.js & Three.js Property Demo Concept
**Created**: 2026-01-21
