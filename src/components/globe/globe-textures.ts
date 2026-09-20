import * as THREE from 'three';

// High-fidelity continent equirectangular polygons [longitude, latitude] matching real geography
const DETAILED_CONTINENTS: [number, number][][] = [
  // 1. North America (High detail: Alaska, Canada, Hudson Bay, US East/West, Florida, Baja, Mexico)
  [
    [-168, 65], [-162, 70], [-150, 71], [-130, 70], [-115, 69], [-95, 68],
    [-80, 70], [-80, 62], [-88, 58], [-92, 54], [-88, 51], [-82, 52],
    [-78, 55], [-76, 62], [-66, 60], [-60, 56], [-53, 47], [-60, 46],
    [-64, 45], [-67, 44], [-70, 42], [-74, 40], [-76, 37], [-75, 35],
    [-80, 31], [-80, 25], [-82, 25], [-83, 29], [-86, 30], [-90, 29],
    [-97, 26], [-97, 20], [-90, 19], [-88, 16], [-83, 10], [-77, 8],
    [-83, 10], [-87, 13], [-92, 16], [-97, 18], [-105, 23], [-110, 28],
    [-115, 32], [-117, 32.5], [-122, 37], [-124, 40], [-124, 46], [-128, 50],
    [-132, 54], [-140, 59], [-152, 60], [-160, 56], [-166, 54], [-168, 65],
  ],
  // Baja California
  [
    [-115, 32], [-113, 29], [-110, 24], [-109, 23], [-111, 26], [-114, 31], [-115, 32],
  ],
  // Florida Peninsula Accent
  [
    [-81, 30], [-80, 26], [-81, 25], [-82, 28], [-84, 30], [-81, 30],
  ],
  // Greenland
  [
    [-45, 60], [-35, 65], [-20, 70], [-18, 77], [-22, 82], [-35, 83],
    [-55, 82], [-65, 76], [-55, 68], [-45, 60],
  ],
  // Cuba & Caribbean
  [
    [-84, 22], [-75, 20], [-74, 20], [-84, 23], [-84, 22],
  ],
  // 2. South America
  [
    [-77, 8], [-72, 11], [-63, 11], [-50, 0], [-35, -5], [-35, -10],
    [-38, -13], [-40, -22], [-45, -24], [-49, -28], [-53, -33], [-58, -35],
    [-65, -42], [-66, -48], [-65, -55], [-70, -53], [-75, -50], [-73, -45],
    [-72, -38], [-70, -30], [-70, -20], [-75, -15], [-80, -5], [-81, -2],
    [-79, 3], [-77, 8],
  ],
  // 3. Europe & Mediterranean (UK, Scandinavia, France, Iberia, Italy, Central Europe)
  [
    [-9, 36], [-8, 43], [-1, 44], [-4, 48], [-5, 48], [-1, 50],
    [2, 51], [8, 54], [10, 57], [12, 55], [14, 54], [18, 55],
    [24, 58], [28, 60], [30, 65], [40, 68], [35, 55], [28, 45],
    [26, 40], [22, 38], [15, 38], [15, 42], [12, 44], [9, 44],
    [3, 42], [-3, 37], [-9, 36],
  ],
  // British Isles & Ireland
  [
    [-5, 50], [1.5, 52], [0, 56], [-3, 58], [-5, 58], [-4, 52], [-5, 50],
  ],
  [
    [-10, 52], [-6, 52], [-6, 55], [-10, 54], [-10, 52],
  ],
  // Scandinavia (Norway & Sweden)
  [
    [5, 58], [10, 58], [18, 60], [25, 65], [28, 70], [18, 71],
    [12, 65], [5, 62], [5, 58],
  ],
  // Italy Boot
  [
    [9, 44], [12, 44], [16, 41], [18, 40], [15, 38], [14, 41], [9, 44],
  ],
  // 4. Africa (with Madagascar & Horn of Africa)
  [
    [-17, 15], [-16, 22], [-12, 28], [-5, 36], [10, 37], [25, 32],
    [30, 31], [33, 28], [39, 22], [43, 12], [51, 12], [47, 5],
    [42, -3], [40, -10], [35, -20], [32, -28], [28, -34], [18, -34],
    [15, -25], [12, -15], [9, 0], [4, 5], [-5, 5], [-13, 8],
    [-17, 15],
  ],
  // Madagascar
  [
    [44, -12], [50, -14], [48, -25], [44, -25], [44, -12],
  ],
  // 5. Asia, Middle East & Russia
  [
    [30, 31], [35, 32], [40, 37], [45, 38], [50, 30], [55, 25],
    [60, 25], [68, 24], [72, 20], [77, 8], [80, 13], [88, 22],
    [92, 16], [98, 10], [103, 1], [104, 10], [108, 18], [118, 22],
    [121, 31], [122, 38], [128, 38], [130, 42], [140, 50], [145, 60],
    [160, 60], [170, 65], [180, 68], [170, 72], [140, 73], [100, 76],
    [70, 73], [55, 68], [45, 60], [35, 50], [30, 40], [30, 31],
  ],
  // Arabian Peninsula
  [
    [35, 30], [45, 30], [55, 25], [60, 22], [55, 16], [45, 12],
    [43, 15], [35, 28], [35, 30],
  ],
  // Japan (Honshu & Hokkaido)
  [
    [130, 32], [135, 34], [141, 38], [142, 44], [140, 45], [139, 36],
    [132, 33], [130, 32],
  ],
  // Indonesia & Malaysia
  [
    [95, 5], [105, 2], [115, -4], [125, -8], [115, -8], [100, -5], [95, 5],
  ],
  // 6. Australia & New Zealand
  [
    [114, -22], [122, -16], [130, -12], [136, -12], [142, -10], [146, -18],
    [153, -28], [150, -37], [145, -38], [138, -35], [130, -32], [116, -35],
    [114, -30], [113, -24], [114, -22],
  ],
  // New Zealand
  [
    [166, -46], [174, -41], [178, -37], [175, -42], [168, -46], [166, -46],
  ],
  // 7. Antarctica
  [
    [-180, -70], [-140, -72], [-80, -68], [-60, -64], [-55, -64],
    [-40, -72], [0, -68], [40, -66], [80, -66], [120, -66],
    [160, -68], [180, -70], [180, -90], [-180, -90], [-180, -70],
  ],
];

// Dense City Lights Network matching Image 2's glittering night clusters
const METRO_LIGHT_NODES: [number, number, number, string][] = [
  // North America - US East Coast & Midwest Megalopolis (Very dense bright lime/white in Image 2)
  [-74.0, 40.7, 1.2, '#ffffff'], // NYC
  [-71.0, 42.3, 1.0, '#ecfdf5'], // Boston
  [-75.1, 39.9, 1.0, '#ffffff'], // Philadelphia
  [-77.0, 38.9, 1.1, '#ffffff'], // Washington DC
  [-76.6, 39.3, 0.8, '#ffffba'], // Baltimore
  [-84.4, 33.7, 1.0, '#bbf7d0'], // Atlanta
  [-80.2, 25.8, 1.1, '#67e8f9'], // Miami
  [-81.4, 28.5, 0.9, '#fef08a'], // Orlando
  [-82.4, 27.9, 0.9, '#ffffba'], // Tampa
  [-87.6, 41.8, 1.2, '#ffffff'], // Chicago
  [-83.0, 42.3, 0.9, '#fef08a'], // Detroit
  [-81.7, 41.5, 0.8, '#ffffba'], // Cleveland
  [-80.0, 40.4, 0.8, '#fef08a'], // Pittsburgh
  [-86.1, 39.8, 0.8, '#ffffba'], // Indianapolis
  [-93.2, 44.9, 0.9, '#ffffff'], // Minneapolis
  [-90.2, 38.6, 0.8, '#ffffba'], // St. Louis
  [-79.3, 43.6, 1.1, '#ffffff'], // Toronto
  [-73.5, 45.5, 0.9, '#dcfce7'], // Montreal

  // North America - Texas, West Coast & Pacific (Image 2 vibrant nodes)
  [-96.8, 32.8, 1.1, '#fef08a'], // Dallas
  [-95.3, 29.7, 1.0, '#ffffff'], // Houston
  [-97.7, 30.2, 0.9, '#bbf7d0'], // Austin
  [-104.9, 39.7, 1.0, '#ffffff'], // Denver
  [-112.0, 33.4, 0.9, '#ffffba'], // Phoenix
  [-115.1, 36.1, 1.0, '#ecfdf5'], // Las Vegas
  [-118.2, 34.0, 1.2, '#ffffff'], // Los Angeles
  [-117.1, 32.7, 0.9, '#ffffba'], // San Diego
  [-122.4, 37.7, 1.1, '#ffffff'], // San Francisco
  [-121.9, 37.3, 0.9, '#bbf7d0'], // San Jose
  [-122.6, 45.5, 0.9, '#ffffff'], // Portland
  [-122.3, 47.6, 1.1, '#ffffff'], // Seattle
  [-123.1, 49.2, 0.9, '#ecfdf5'], // Vancouver
  [-99.1, 19.4, 1.1, '#fef08a'], // Mexico City
  [-82.3, 23.1, 0.8, '#ffffba'], // Havana

  // Europe (Image 2 upper-right illuminated horizon)
  [-0.1, 51.5, 1.2, '#ffffff'], // London
  [2.3, 48.8, 1.2, '#ffffff'], // Paris
  [4.3, 50.8, 0.9, '#ffffba'], // Brussels
  [4.9, 52.3, 1.0, '#bbf7d0'], // Amsterdam
  [8.7, 50.1, 1.0, '#ffffff'], // Frankfurt
  [13.4, 52.5, 1.0, '#fef08a'], // Berlin
  [11.5, 48.1, 0.9, '#ffffff'], // Munich
  [9.2, 45.4, 1.0, '#fef08a'], // Milan
  [12.5, 41.9, 0.9, '#ffffba'], // Rome
  [-3.7, 40.4, 1.0, '#ffffff'], // Madrid
  [2.1, 41.3, 0.9, '#bbf7d0'], // Barcelona
  [-9.1, 38.7, 0.8, '#ffffba'], // Lisbon
  [-6.2, 53.3, 0.8, '#ffffff'], // Dublin

  // South America
  [-74.0, 4.7, 0.9, '#fef08a'], // Bogota
  [-77.0, -12.0, 0.9, '#ffffff'], // Lima
  [-70.6, -33.4, 0.9, '#ffffba'], // Santiago
  [-58.3, -34.6, 1.1, '#ffffff'], // Buenos Aires
  [-46.6, -23.5, 1.2, '#ffffff'], // Sao Paulo
  [-43.1, -22.9, 1.0, '#fef08a'], // Rio

  // Asia & Oceania
  [139.7, 35.6, 1.2, '#ffffff'], // Tokyo
  [126.9, 37.5, 1.1, '#ffffff'], // Seoul
  [121.4, 31.2, 1.2, '#ffffff'], // Shanghai
  [116.4, 39.9, 1.1, '#ffffff'], // Beijing
  [114.1, 22.3, 1.1, '#ffffff'], // Hong Kong
  [103.8, 1.3, 1.1, '#ffffff'], // Singapore
  [72.8, 19.0, 1.1, '#fef08a'], // Mumbai
  [55.3, 25.2, 1.1, '#ffffff'], // Dubai
  [151.2, -33.8, 1.1, '#ffffff'], // Sydney
  [144.9, -37.8, 1.0, '#ffffba'], // Melbourne
];

export type GlobeColorTheme = 'midnight' | 'hologram' | 'obsidian' | 'emerald';

export interface ThemePalette {
  id: GlobeColorTheme;
  name: string;
  badge: string;
  oceanStops: [number, string][];
  graticule: string;
  equator: string;
  landFill: string;
  landStroke: string;
  landGlow: string;
  landInnerFill: string;
  landInnerStroke: string;
  lakes: string;
  atmosphereColor: string;
  atmosphereOpacity: number;
  specularShininess: number;
}

export const THEME_PALETTES: Record<GlobeColorTheme, ThemePalette> = {
  midnight: {
    id: 'midnight',
    name: 'Cyber Midnight',
    badge: 'Sapphire & Cyan',
    oceanStops: [
      [0.0, '#020817'],
      [0.2, '#04132b'],
      [0.45, '#071f43'],
      [0.7, '#0b2954'],
      [0.9, '#04132b'],
      [1.0, '#020817'],
    ],
    graticule: 'rgba(56, 189, 248, 0.18)',
    equator: 'rgba(0, 245, 255, 0.45)',
    landFill: '#091e36', // Rich deep sapphire slate
    landStroke: '#00f5ff', // Luminous neon cyan coastline
    landGlow: '#00f5ff',
    landInnerFill: 'rgba(0, 245, 255, 0.09)',
    landInnerStroke: 'rgba(56, 189, 248, 0.35)',
    lakes: '#071f43',
    atmosphereColor: '#00f5ff',
    atmosphereOpacity: 0.65,
    specularShininess: 0.22,
  },
  hologram: {
    id: 'hologram',
    name: 'Ice Hologram',
    badge: 'Pearlescent Cyan',
    oceanStops: [
      [0.0, '#c7e9f8'],
      [0.2, '#daf1fb'],
      [0.45, '#aee0f5'],
      [0.7, '#67b8dd'],
      [0.9, '#3a8eb8'],
      [1.0, '#226991'],
    ],
    graticule: 'rgba(255, 255, 255, 0.45)',
    equator: 'rgba(255, 255, 255, 0.7)',
    landFill: '#11354e',
    landStroke: '#00f5ff',
    landGlow: '#00f5ff',
    landInnerFill: 'rgba(34, 211, 238, 0.14)',
    landInnerStroke: '#38bdf8',
    lakes: '#67b8dd',
    atmosphereColor: '#38bdf8',
    atmosphereOpacity: 0.55,
    specularShininess: 0.15,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Stealth Obsidian',
    badge: 'Pitch Black & Sky',
    oceanStops: [
      [0.0, '#030712'],
      [0.3, '#0b0f19'],
      [0.7, '#0b0f19'],
      [1.0, '#030712'],
    ],
    graticule: 'rgba(148, 163, 184, 0.12)',
    equator: 'rgba(56, 189, 248, 0.35)',
    landFill: '#172233',
    landStroke: '#38bdf8',
    landGlow: '#38bdf8',
    landInnerFill: 'rgba(56, 189, 248, 0.06)',
    landInnerStroke: 'rgba(56, 189, 248, 0.25)',
    lakes: '#0b0f19',
    atmosphereColor: '#38bdf8',
    atmosphereOpacity: 0.5,
    specularShininess: 0.25,
  },
  emerald: {
    id: 'emerald',
    name: 'Tactical Emerald',
    badge: 'Matrix Pine & Lime',
    oceanStops: [
      [0.0, '#02120b'],
      [0.3, '#052214'],
      [0.7, '#083321'],
      [1.0, '#02120b'],
    ],
    graticule: 'rgba(52, 211, 153, 0.16)',
    equator: 'rgba(74, 222, 128, 0.45)',
    landFill: '#064e3b',
    landStroke: '#10b981',
    landGlow: '#34d399',
    landInnerFill: 'rgba(52, 211, 153, 0.12)',
    landInnerStroke: 'rgba(16, 185, 129, 0.4)',
    lakes: '#052214',
    atmosphereColor: '#10b981',
    atmosphereOpacity: 0.55,
    specularShininess: 0.2,
  },
};

/**
 * Generates an ultra-crisp procedural Earth map canvas texture
 * Defaults to Deep Cyber Midnight (dark sapphire ocean, glowing neon-cyan coastlines, golden city lights)
 */
export function createEarthCanvasTexture(theme: GlobeColorTheme = 'midnight'): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.midnight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Helper: map longitude/latitude to canvas (x, y)
  function geoToCanvas(lng: number, lat: number): [number, number] {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  }

  // 1. Ocean Background Gradient
  const oceanGradient = ctx.createLinearGradient(0, 0, width, height);
  palette.oceanStops.forEach(([pos, color]) => {
    oceanGradient.addColorStop(pos, color);
  });
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Graticule Lines (subtle latitude & longitude grid)
  ctx.strokeStyle = palette.graticule;
  ctx.lineWidth = 1;

  // Latitudes
  for (let lat = -80; lat <= 80; lat += 20) {
    const [, y] = geoToCanvas(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Longitudes
  for (let lng = -180; lng <= 180; lng += 30) {
    const [x] = geoToCanvas(lng, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator highlight line
  const [, eqY] = geoToCanvas(0, 0);
  ctx.strokeStyle = palette.equator;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  // 3. Draw Detailed Continents: Deep contrast body with glowing neon shoreline
  ctx.fillStyle = palette.landFill;
  ctx.strokeStyle = palette.landStroke;
  ctx.lineWidth = 3.2;
  ctx.shadowColor = palette.landGlow;
  ctx.shadowBlur = 12;

  DETAILED_CONTINENTS.forEach((polygon) => {
    if (polygon.length === 0) return;
    ctx.beginPath();
    const [startX, startY] = geoToCanvas(polygon[0][0], polygon[0][1]);
    ctx.moveTo(startX, startY);

    for (let i = 1; i < polygon.length; i++) {
      const [px, py] = geoToCanvas(polygon[i][0], polygon[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Reset shadow
  ctx.shadowBlur = 0;

  // 4. Inner Topographic Contour Shading for Realistic 3D Continent Depth
  ctx.fillStyle = palette.landInnerFill;
  ctx.strokeStyle = palette.landInnerStroke;
  ctx.lineWidth = 1.2;

  DETAILED_CONTINENTS.forEach((polygon) => {
    if (polygon.length < 5) return;
    ctx.beginPath();
    const [startX, startY] = geoToCanvas(polygon[0][0], polygon[0][1]);
    ctx.moveTo(startX + 2, startY + 2);
    for (let i = 1; i < polygon.length; i++) {
      const [px, py] = geoToCanvas(polygon[i][0], polygon[i][1]);
      ctx.lineTo(px + 1.5, py + 1.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // 5. Great Lakes & Inland Waterway Accents
  const GREAT_LAKES = [
    [-87.0, 44.0, 7], // Lake Michigan
    [-82.5, 44.5, 8], // Lake Huron
    [-87.5, 47.5, 10], // Lake Superior
    [-81.0, 42.2, 6], // Lake Erie
  ];
  ctx.fillStyle = palette.lakes;
  GREAT_LAKES.forEach(([lng, lat, r]) => {
    const [lx, ly] = geoToCanvas(lng, lat);
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 6. City Night Lights Network (Glittering white & golden LEDs matching Image 2)
  METRO_LIGHT_NODES.forEach(([lng, lat, intensity, color]) => {
    const [cx, cy] = geoToCanvas(lng, lat);
    const rad = 7 * intensity;

    // Glowing atmospheric radial halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 3.5);
    halo.addColorStop(0, color);
    halo.addColorStop(0.35, 'rgba(254, 240, 138, 0.75)');
    halo.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Brilliant white pinpoint LED core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Secondary glittering highway cluster dots
    const clusterCount = Math.floor(4 * intensity);
    for (let s = 0; s < clusterCount; s++) {
      const angle = (s / clusterCount) * Math.PI * 2 + 0.3;
      const dist = rad * (1.2 + (s % 2) * 0.6);
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;

      ctx.fillStyle = s % 2 === 0 ? '#fef08a' : '#dcfce7';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 7. Dense Bos-Wash and California highway light chains (Image 2 dense sparkle)
  const HIGHWAY_CHAINS = [
    // US Northeast corridor (Richmond -> DC -> Baltimore -> Philly -> NYC -> Boston)
    [-77.5, 37.5], [-76.8, 38.2], [-76.0, 39.5], [-75.0, 40.2], [-73.5, 41.2], [-72.0, 41.8],
    // California coastal corridor (San Diego -> LA -> Santa Barbara -> SF)
    [-117.5, 33.2], [-118.0, 33.7], [-119.5, 34.4], [-121.0, 36.0], [-121.5, 36.8],
    // Texas triangle (Houston -> Austin -> Dallas)
    [-96.0, 30.0], [-96.5, 31.0], [-97.2, 31.8],
    // Western Europe corridor (London -> Paris -> Frankfurt -> Milan)
    [0.5, 51.0], [1.5, 50.0], [3.5, 49.5], [6.0, 49.8], [7.5, 49.0], [9.0, 46.5],
  ];

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  HIGHWAY_CHAINS.forEach(([lng, lat]) => {
    const [hx, hy] = geoToCanvas(lng, lat);
    ctx.beginPath();
    ctx.arc(hx, hy, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Tiny halo
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  return texture;
}

/**
 * Creates subtle space background starfield particles
 */
export function createStarfield(count = 500, radius = 40): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius * (0.8 + Math.random() * 0.4);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    // Warm white / ice blue stars
    const isIce = Math.random() > 0.4;
    colors[i3] = isIce ? 0.7 : 1.0;
    colors[i3 + 1] = isIce ? 0.9 : 0.95;
    colors[i3 + 2] = isIce ? 1.0 : 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  return new THREE.Points(geometry, material);
}
