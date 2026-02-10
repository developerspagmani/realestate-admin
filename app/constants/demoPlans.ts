export const DEMO_HOUSE_PLANS = [
    {
        id: 'eco-compact',
        name: 'The Eco-Compact 2BHK',
        tier: 'Small (< 1200 Sqft)',
        description: 'Sustainable design with cross-ventilation, vertical gardens, and optimized floor space for urban living.',
        preview: 'https://images.unsplash.com/photo-1449156001933-973406b3ddd2?w=500&h=300&fit=crop',
        config: { scene: { background: '#f0f4f8' }, camera: { position: { x: 12, y: 18, z: 12 } } },
        layout: [
            // Foundation / Floor
            { id: 'floor', unitCode: 'Base', type: 'flat', position: { x: 0, y: 0.1, z: 0 }, dimensions: { w: 8, h: 0.1, d: 8 }, color: '#e2e8f0' },
            // Living Area
            { id: 'living', unitCode: 'Living Room', type: 'villa', position: { x: -2, y: 1.5, z: 2 }, dimensions: { w: 4, h: 3, d: 4 }, color: '#ffffff' },
            // Bed 1
            { id: 'bed1', unitCode: 'Master Bed', type: 'villa', position: { x: 2.5, y: 1.5, z: 2 }, dimensions: { w: 3, h: 3, d: 4 }, color: '#fffaf0' },
            // Bed 2
            { id: 'bed2', unitCode: 'Kids Room', type: 'villa', position: { x: 2.5, y: 1.5, z: -2 }, dimensions: { w: 3, h: 3, d: 3 }, color: '#f0fff4' },
            // Kitchen
            { id: 'kitchen', unitCode: 'Kitchen', type: 'office', position: { x: -2.5, y: 1.2, z: -2 }, dimensions: { w: 3, h: 2.4, d: 3 }, color: '#edf2f7' },
            // Terrace
            { id: 'terrace', unitCode: 'Garden Terrace', type: 'flat', position: { x: -3, y: 3.1, z: 0 }, dimensions: { w: 2, h: 0.2, d: 4 }, color: '#c6f6d5' }
        ]
    },
    {
        id: 'modern-edge',
        name: 'The Modern Edge Duplex',
        tier: 'Medium (1200-2500 Sqft)',
        description: 'Ultra-modern cantilevered architecture featuring a double-height living room and smart automated systems.',
        preview: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop',
        config: { scene: { background: '#f7fafc' }, camera: { position: { x: 20, y: 25, z: 20 } } },
        layout: [
            // Ground Floor
            { id: 'gf-main', unitCode: 'Grand Hall', type: 'villa', position: { x: 0, y: 1.5, z: 1 }, dimensions: { w: 10, h: 3, d: 8 }, color: '#ffffff' },
            // Cantilevered First Floor
            { id: 'ff-master', unitCode: 'Sky Suite', type: 'villa', position: { x: 2, y: 4.5, z: 0 }, dimensions: { w: 8, h: 3, d: 6 }, color: '#ffffff' },
            // Deck
            { id: 'deck', unitCode: 'Sun Deck', type: 'flat', position: { x: -4, y: 0.1, z: 6 }, dimensions: { w: 6, h: 0.1, d: 4 }, color: '#ecc94b' },
            // Features
            { id: 'garage', unitCode: 'EV Garage', type: 'office', position: { x: 6, y: 1, z: 6 }, dimensions: { w: 4, h: 2, d: 4 }, color: '#4a5568' }
        ]
    },
    {
        id: 'imperial-estate',
        name: 'The Imperial Estate',
        tier: 'Large (> 2500 Sqft)',
        description: 'Vast luxury manor with dedicated hobby rooms, wine cellar, and a signature infinity pool concept.',
        preview: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=300&fit=crop',
        config: { scene: { background: '#fdfdfd' }, camera: { position: { x: 25, y: 30, z: 25 } } },
        layout: [
            // Main Structure
            { id: 'm1', unitCode: 'Central Manor', type: 'villa', position: { x: 0, y: 2, z: 0 }, dimensions: { w: 14, h: 4, d: 10 }, color: '#ffffff' },
            // Guests / Servants
            { id: 'g1', unitCode: 'Guest Wing', type: 'villa', position: { x: 12, y: 1.5, z: 4 }, dimensions: { w: 6, h: 3, d: 6 }, color: '#f8f9fa' },
            // Pool
            { id: 'pool', unitCode: 'Infinity Pool', type: 'lake', position: { x: 0, y: 0.2, z: 12 }, dimensions: { w: 16, h: 0.3, d: 8 }, color: '#4299e1' },
            // Outdoor Kitchen
            { id: 'ok', unitCode: 'BBQ Lounge', type: 'flat', position: { x: -10, y: 0.5, z: 10 }, dimensions: { w: 4, h: 1, d: 4 }, color: '#d69e2e' },
            // Greenery
            { id: 't1', unitCode: 'Garden East', type: 'tree', position: { x: 15, y: 0, z: -10 } }
        ]
    },
    {
        id: 'nordic-sky',
        name: 'The Nordic Sky Cabin',
        tier: 'Small (< 1200 Sqft)',
        description: 'Minimalist Scandinavian aesthetic focused on light wood, glass, and seamless indoor-outdoor transition.',
        preview: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=300&fit=crop',
        config: { scene: { background: '#ffffff' }, camera: { position: { x: 15, y: 15, z: 15 } } },
        layout: [
            { id: 'main', unitCode: 'Open Studio', type: 'villa', position: { x: 0, y: 1.5, z: 0 }, dimensions: { w: 9, h: 3, d: 7 }, color: '#ffffff' },
            { id: 'glass', unitCode: 'Glass Facade', type: 'flat', position: { x: 0, y: 1.5, z: 3.5 }, dimensions: { w: 9, h: 3, d: 0.1 }, color: '#ebf8ff' }
        ]
    },
    {
        id: 'industrial-loft',
        name: 'The Brutalist Loft',
        tier: 'Medium (1200-2500 Sqft)',
        description: 'Raw concrete finishes, exposed metal structures, and an open-plan layout for the bold homeowner.',
        preview: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?w=500&h=300&fit=crop',
        config: { scene: { background: '#2d3748' }, camera: { position: { x: 18, y: 22, z: 18 } } },
        layout: [
            { id: 'core', unitCode: 'Main Loft', type: 'villa', position: { x: 0, y: 2.5, z: 0 }, dimensions: { w: 12, h: 5, d: 9 }, color: '#a0aec0' },
            { id: 'mezz', unitCode: 'Mezzanine Bed', type: 'flat', position: { x: 3, y: 4, z: 0 }, dimensions: { w: 5, h: 0.2, d: 8 }, color: '#4a5568' }
        ]
    }
];
