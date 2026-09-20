import * as THREE from 'three';

export interface ContinentNode {
  id: string;
  name: string; // Continent name
  sidebarTitle: string; // Sidebar Item Name
  route: string;
  lat: number;
  lng: number;
  color: string;
  glowColor: string;
  description: string;
  roleHint: string;
  stats: {
    label: string;
    value: string;
  };
}

export interface NewsArc {
  id: string;
  from?: string; // Continent id
  to?: string; // Continent id
  fromCoords?: [number, number]; // [latitude, longitude]
  toCoords?: [number, number]; // [latitude, longitude]
  color?: string;
  speed: number;
  pulseSize?: number;
}

export const CONTINENTS: ContinentNode[] = [
  {
    id: 'north-america',
    name: 'North America',
    sidebarTitle: 'Dashboard',
    route: '/',
    lat: 39.5,
    lng: -98.3,
    color: '#38bdf8', // Vibrant Sky Cyan matching Image 2
    glowColor: '#00f5ff',
    description: 'Newsroom Global Command & Real-time Telemetry Desk',
    roleHint: 'Core Operational Dashboard',
    stats: { label: 'Live Traffic', value: '42.8k req/m' },
  },
  {
    id: 'europe',
    name: 'Europe',
    sidebarTitle: 'Editorial Queue',
    route: '/articles',
    lat: 51.2,
    lng: 10.4,
    color: '#86efac', // Lime / Emerald tint
    glowColor: '#4ade80',
    description: 'Story Staging, Verification & Chief Editor Approvals',
    roleHint: 'Review Pipeline & Staging',
    stats: { label: 'Queue Depth', value: '18 In Review' },
  },
  {
    id: 'asia',
    name: 'Asia',
    sidebarTitle: 'Write New Story',
    route: '/articles/new',
    lat: 34.0,
    lng: 102.5,
    color: '#f43f5e', // Rose 500
    glowColor: '#fb7185',
    description: 'Live Newsroom Studio, Breaking News & Rich Block Editor',
    roleHint: 'Fast-Track Publishing Studio',
    stats: { label: 'Bureaus Active', value: '24 Reporters' },
  },
  {
    id: 'africa',
    name: 'Africa',
    sidebarTitle: 'Media Assets',
    route: '/media',
    lat: 3.5,
    lng: 21.7,
    color: '#10b981', // Emerald 500
    glowColor: '#34d399',
    description: 'Photojournalism Vault, Asset Ingestion & CDN Deliveries',
    roleHint: 'High-Res Media Archive',
    stats: { label: 'Asset Storage', value: '1,420 Items' },
  },
  {
    id: 'south-america',
    name: 'South America',
    sidebarTitle: 'Categories',
    route: '/categories',
    lat: -14.2,
    lng: -55.9,
    color: '#a855f7', // Purple 500
    glowColor: '#c084fc',
    description: 'News Desks, Regional Taxonomy & Section Hierarchies',
    roleHint: 'Taxonomy Governance',
    stats: { label: 'Sections', value: '12 Active Desks' },
  },
  {
    id: 'oceania',
    name: 'Oceania',
    sidebarTitle: 'Tags',
    route: '/tags',
    lat: -25.2,
    lng: 133.7,
    color: '#06b6d4', // Cyan 500
    glowColor: '#22d3ee',
    description: 'Trending Signals, Semantic Hashtags & Entity Clusters',
    roleHint: 'Real-time Signal Tagging',
    stats: { label: 'Signals', value: '389 Topics' },
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    sidebarTitle: 'Staff & Roles',
    route: '/users',
    lat: -80.0,
    lng: 0.0,
    color: '#e2e8f0', // Ice white
    glowColor: '#93c5fd',
    description: 'Access Control, Staff Roles & Bureau Identity Management',
    roleHint: 'Security & Access Protocols',
    stats: { label: 'Secure Accounts', value: 'Admin Gated' },
  },
];

export const NEWS_ARCS: NewsArc[] = [
  // 1. North American High-Density Data Grid (exact like Image 2)
  {
    id: 'arc-nyc-la',
    fromCoords: [40.7, -74.0], // NYC
    toCoords: [34.0, -118.2], // LA
    color: '#bbf7d0',
    speed: 0.9,
    pulseSize: 0.07,
  },
  {
    id: 'arc-nyc-sf',
    fromCoords: [40.7, -74.0],
    toCoords: [37.7, -122.4], // SF
    color: '#86efac',
    speed: 0.85,
    pulseSize: 0.06,
  },
  {
    id: 'arc-dc-seattle',
    fromCoords: [38.9, -77.0], // DC
    toCoords: [47.6, -122.3], // Seattle
    color: '#dcfce7',
    speed: 0.8,
    pulseSize: 0.06,
  },
  {
    id: 'arc-nyc-chicago',
    fromCoords: [40.7, -74.0],
    toCoords: [41.8, -87.6], // Chicago
    color: '#ecfdf5',
    speed: 1.1,
    pulseSize: 0.06,
  },
  {
    id: 'arc-nyc-miami',
    fromCoords: [40.7, -74.0],
    toCoords: [25.8, -80.2], // Miami
    color: '#a7f3d0',
    speed: 1.0,
    pulseSize: 0.06,
  },
  {
    id: 'arc-chicago-dallas',
    fromCoords: [41.8, -87.6],
    toCoords: [32.8, -96.8], // Dallas
    color: '#bbf7d0',
    speed: 0.95,
    pulseSize: 0.05,
  },
  {
    id: 'arc-dallas-la',
    fromCoords: [32.8, -96.8],
    toCoords: [34.0, -118.2],
    color: '#86efac',
    speed: 0.9,
    pulseSize: 0.06,
  },
  {
    id: 'arc-chicago-denver',
    fromCoords: [41.8, -87.6],
    toCoords: [39.7, -104.9], // Denver
    color: '#6ee7b7',
    speed: 0.85,
    pulseSize: 0.05,
  },
  {
    id: 'arc-denver-sf',
    fromCoords: [39.7, -104.9],
    toCoords: [37.7, -122.4],
    color: '#a7f3d0',
    speed: 0.8,
    pulseSize: 0.05,
  },
  {
    id: 'arc-atlanta-nyc',
    fromCoords: [33.7, -84.4], // Atlanta
    toCoords: [40.7, -74.0],
    color: '#bbf7d0',
    speed: 1.1,
    pulseSize: 0.05,
  },
  {
    id: 'arc-seattle-la',
    fromCoords: [47.6, -122.3],
    toCoords: [34.0, -118.2],
    color: '#dcfce7',
    speed: 0.9,
    pulseSize: 0.05,
  },
  {
    id: 'arc-boston-chicago',
    fromCoords: [42.3, -71.0], // Boston
    toCoords: [41.8, -87.6],
    color: '#ecfdf5',
    speed: 1.0,
    pulseSize: 0.05,
  },
  {
    id: 'arc-toronto-nyc',
    fromCoords: [43.6, -79.3], // Toronto
    toCoords: [40.7, -74.0],
    color: '#a7f3d0',
    speed: 1.2,
    pulseSize: 0.05,
  },

  // 2. Transatlantic Intercontinental Data Highways (US to Europe)
  {
    id: 'arc-nyc-london',
    fromCoords: [40.7, -74.0],
    toCoords: [51.5, -0.1], // London
    color: '#ffffff',
    speed: 0.75,
    pulseSize: 0.08,
  },
  {
    id: 'arc-boston-paris',
    fromCoords: [42.3, -71.0],
    toCoords: [48.8, 2.3], // Paris
    color: '#bbf7d0',
    speed: 0.7,
    pulseSize: 0.07,
  },
  {
    id: 'arc-dc-frankfurt',
    fromCoords: [38.9, -77.0],
    toCoords: [50.1, 8.7], // Frankfurt
    color: '#86efac',
    speed: 0.72,
    pulseSize: 0.07,
  },
  {
    id: 'arc-montreal-london',
    fromCoords: [45.5, -73.5], // Montreal
    toCoords: [51.5, -0.1],
    color: '#dcfce7',
    speed: 0.78,
    pulseSize: 0.06,
  },
  {
    id: 'arc-miami-madrid',
    fromCoords: [25.8, -80.2],
    toCoords: [40.4, -3.7], // Madrid
    color: '#67e8f9',
    speed: 0.68,
    pulseSize: 0.06,
  },

  // 3. Americas to South America & Caribbean
  {
    id: 'arc-miami-bogota',
    fromCoords: [25.8, -80.2],
    toCoords: [4.7, -74.0], // Bogota
    color: '#34d399',
    speed: 0.85,
    pulseSize: 0.06,
  },
  {
    id: 'arc-nyc-saopaulo',
    fromCoords: [40.7, -74.0],
    toCoords: [-23.5, -46.6], // Sao Paulo
    color: '#a855f7',
    speed: 0.65,
    pulseSize: 0.06,
  },
  {
    id: 'arc-saopaulo-buenosaires',
    fromCoords: [-23.5, -46.6],
    toCoords: [-34.6, -58.3], // Buenos Aires
    color: '#c084fc',
    speed: 0.9,
    pulseSize: 0.05,
  },

  // 4. Global Arteries across Europe, Middle East & Asia
  {
    id: 'arc-london-dubai',
    fromCoords: [51.5, -0.1],
    toCoords: [25.2, 55.3], // Dubai
    color: '#38bdf8',
    speed: 0.75,
    pulseSize: 0.06,
  },
  {
    id: 'arc-dubai-mumbai',
    fromCoords: [25.2, 55.3],
    toCoords: [19.0, 72.8], // Mumbai
    color: '#f43f5e',
    speed: 0.85,
    pulseSize: 0.06,
  },
  {
    id: 'arc-mumbai-singapore',
    fromCoords: [19.0, 72.8],
    toCoords: [1.3, 103.8], // Singapore
    color: '#fb7185',
    speed: 0.8,
    pulseSize: 0.06,
  },
  {
    id: 'arc-singapore-tokyo',
    fromCoords: [1.3, 103.8],
    toCoords: [35.6, 139.7], // Tokyo
    color: '#86efac',
    speed: 0.8,
    pulseSize: 0.06,
  },
  {
    id: 'arc-tokyo-sydney',
    fromCoords: [35.6, 139.7],
    toCoords: [-33.8, 151.2], // Sydney
    color: '#22d3ee',
    speed: 0.7,
    pulseSize: 0.06,
  },
  {
    id: 'arc-sydney-auckland',
    fromCoords: [-33.8, 151.2],
    toCoords: [-36.8, 174.7], // Auckland
    color: '#38bdf8',
    speed: 1.0,
    pulseSize: 0.05,
  },
  {
    id: 'arc-london-johannesburg',
    fromCoords: [51.5, -0.1],
    toCoords: [-26.2, 28.0], // Johannesburg
    color: '#10b981',
    speed: 0.65,
    pulseSize: 0.06,
  },
];

/**
 * Converts Latitude and Longitude to 3D Cartesian Vector3 on a sphere.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Cartesian Vector3 on a sphere back to Latitude and Longitude.
 */
export function vector3ToLatLng(vec: THREE.Vector3): { lat: number; lng: number } {
  const norm = vec.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * (180 / Math.PI);
  let lng = Math.atan2(norm.z, -norm.x) * (180 / Math.PI) - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  return { lat, lng };
}

/**
 * Finds the closest continent to a local 3D point on the globe sphere surface.
 */
export function findClosestContinent(
  localPoint: THREE.Vector3,
  radius: number,
  maxDistance = 3.6,
): ContinentNode | null {
  let closest: ContinentNode | null = null;
  let minDistance = Infinity;

  for (const continent of CONTINENTS) {
    const pos = latLngToVector3(continent.lat, continent.lng, radius);
    const dist = localPoint.distanceTo(pos);
    if (dist < minDistance) {
      minDistance = dist;
      closest = continent;
    }
  }

  if (minDistance <= maxDistance) {
    return closest;
  }

  return null;
}
