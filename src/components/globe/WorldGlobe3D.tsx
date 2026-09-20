'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import {
  CONTINENTS,
  NEWS_ARCS,
  ContinentNode,
  latLngToVector3,
  findClosestContinent,
} from './globe-data';
import {
  createEarthCanvasTexture,
  createStarfield,
  GlobeColorTheme,
  THEME_PALETTES,
} from './globe-textures';
import { createAtmosphereMaterial } from './AtmosphereShader';
import { useTheme } from '@/lib/theme-context';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Radio,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  X,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function createContinentLabelSprite(continent: ContinentNode): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 576;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  const x = 16;
  const y = 16;
  const w = 544;
  const h = 128;
  const radius = 32;

  // Background glassmorphism pill
  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = 'rgba(2, 8, 20, 0.92)';
  ctx.fill();

  // Glowing boundary in continent color
  ctx.strokeStyle = continent.color;
  ctx.lineWidth = 4.0;
  ctx.shadowColor = continent.glowColor;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.restore();

  // Status Indicator Dot
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 44, y + h / 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = continent.color;
  ctx.shadowColor = continent.glowColor;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();

  // Primary Continent Name (Bold Uppercase)
  ctx.save();
  ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(continent.name.toUpperCase(), x + 72, y + 44);

  // Sidebar Destination Subtitle
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = continent.glowColor || '#38bdf8';
  ctx.fillText(`• ${continent.sidebarTitle}`, x + 72, y + 88);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.85, 0.52, 1);
  sprite.position.y = 1.15;
  sprite.userData = {
    continentId: continent.id,
    continent,
  };

  return sprite;
}

interface WorldGlobe3DProps {
  height?: string | number;
  className?: string;
  onSelectContinent?: (continent: ContinentNode) => void;
  autoRotateSpeed?: number;
  interactive?: boolean;
  initialTheme?: GlobeColorTheme;
}

export default function WorldGlobe3D({
  height = '520px',
  className = '',
  onSelectContinent,
  autoRotateSpeed = 0.0018,
  interactive = true,
  initialTheme = 'midnight',
}: WorldGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // UI state
  const [selectedContinent, setSelectedContinent] = useState<ContinentNode | null>(null);
  const [hoveredContinent, setHoveredContinent] = useState<ContinentNode | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<GlobeColorTheme>(initialTheme);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isAutoRotatingRef = useRef(isAutoRotating);
  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // References to 3D objects for dynamic manipulation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const earthMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const beaconMeshesRef = useRef<THREE.Mesh[]>([]);
  const continentHitMeshesRef = useRef<THREE.Mesh[]>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);
  const arcPulsesRef = useRef<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[]>([]);

  // Physics, rotation & zoom state
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

  const GLOBE_RADIUS = 5;
  const DEFAULT_DISTANCE = 11.2;
  const MIN_DISTANCE = 6.8;
  const MAX_DISTANCE = 19.0;
  const targetDistanceRef = useRef<number>(DEFAULT_DISTANCE);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: Centered dead-center in the viewport
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(0, 0, DEFAULT_DISTANCE);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with high DPI support
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights: Polished studio lighting matching Image 2
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 1.35);
    scene.add(ambientLight);

    // Strong specular sunlight producing the gleaming highlight on upper right
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(12, 12, 14);
    scene.add(sunLight);

    // Cyan rim fill light
    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    cyanFillLight.position.set(-14, -6, -10);
    scene.add(cyanFillLight);

    // 5. Starfield Background
    const stars = createStarfield(600, 50);
    scene.add(stars);

    // 6. Globe Group (Holds the world, beacons, and arcs to rotate together)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Initial tilt & angle: Centered directly on North America & Atlantic (exact like Image 2)
    globeGroup.rotation.x = 0.32;
    globeGroup.rotation.y = -1.25;

    // 7. Globe Sphere Geometry & Texture (Defaults to Deep Cyber Midnight)
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const initialPalette = THEME_PALETTES[initialTheme] || THEME_PALETTES.midnight;
    const earthTexture = createEarthCanvasTexture(initialTheme);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: initialPalette.specularShininess,
      metalness: 0.08,
      bumpScale: 0.02,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;
    earthMaterialRef.current = earthMaterial;

    // 8. Atmospheric Glow Halo (Fresnel rim)
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.13, 48, 48);
    const atmosphereMaterial = createAtmosphereMaterial(initialPalette.atmosphereColor, initialPalette.atmosphereOpacity);
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
    atmosphereMaterialRef.current = atmosphereMaterial;

    // 9. Outer subtle pulse aura
    const outerAuraGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.22, 32, 32);
    const outerAuraMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(isDark ? '#0284c7' : '#38bdf8') },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * 0.25);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const outerAura = new THREE.Mesh(outerAuraGeo, outerAuraMat);
    scene.add(outerAura);

    // 10. Continent Beacons, Pins, Hit Targets & Floating 3D Labels
    const beacons: THREE.Mesh[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    const labelSprites: THREE.Sprite[] = [];

    CONTINENTS.forEach((continent) => {
      const pos = latLngToVector3(continent.lat, continent.lng, GLOBE_RADIUS);
      const normal = pos.clone().normalize();

      // Large invisible hit target collider around each continent for effortless clicking
      const hitGeo = new THREE.SphereGeometry(1.35, 16, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      hitMesh.userData = { continentId: continent.id, continent };
      globeGroup.add(hitMesh);
      hitMeshes.push(hitMesh);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);

      // Orient beacon along the surface normal
      beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // A. Ground Ripple Ring
      const ringGeo = new THREE.RingGeometry(0.12, 0.24, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: continent.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      beaconGroup.add(ringMesh);

      // B. Vertical Beacon Column
      const colGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 12);
      const colMat = new THREE.MeshBasicMaterial({
        color: continent.glowColor,
        transparent: true,
        opacity: 0.85,
      });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.y = 0.25;
      beaconGroup.add(colMesh);

      // C. Luminous Diamond / Orb Cap (Clickable target)
      const capGeo = new THREE.OctahedronGeometry(0.18, 0);
      const capMat = new THREE.MeshStandardMaterial({
        color: continent.color,
        emissive: continent.glowColor,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.8,
      });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 0.55;
      capMesh.userData = { continentId: continent.id, continent };
      beaconGroup.add(capMesh);
      beacons.push(capMesh);

      // D. Outer Floating Pulse Ring
      const pulseGeo = new THREE.RingGeometry(0.25, 0.35, 24);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: continent.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.rotation.x = Math.PI / 2;
      pulseMesh.position.y = 0.55;
      beaconGroup.add(pulseMesh);

      // E. Floating 3D Continent Label Billboard
      const labelSprite = createContinentLabelSprite(continent);
      beaconGroup.add(labelSprite);
      labelSprites.push(labelSprite);
      hitMeshes.push(labelSprite as unknown as THREE.Mesh);

      globeGroup.add(beaconGroup);
    });
    beaconMeshesRef.current = beacons;
    continentHitMeshesRef.current = hitMeshes;
    labelSpritesRef.current = labelSprites;

    // 11. Orbital News Data Arcs (Dense glowing lime-white flight web matching Image 2)
    const arcPulses: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[] = [];
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);

    NEWS_ARCS.forEach((arc) => {
      let p1: THREE.Vector3 | null = null;
      let p2: THREE.Vector3 | null = null;

      if (arc.fromCoords && arc.toCoords) {
        p1 = latLngToVector3(arc.fromCoords[0], arc.fromCoords[1], GLOBE_RADIUS);
        p2 = latLngToVector3(arc.toCoords[0], arc.toCoords[1], GLOBE_RADIUS);
      } else if (arc.from && arc.to) {
        const fromNode = CONTINENTS.find((c) => c.id === arc.from);
        const toNode = CONTINENTS.find((c) => c.id === arc.to);
        if (fromNode && toNode) {
          p1 = latLngToVector3(fromNode.lat, fromNode.lng, GLOBE_RADIUS);
          p2 = latLngToVector3(toNode.lat, toNode.lng, GLOBE_RADIUS);
        }
      }

      if (!p1 || !p2) return;

      // Midpoint elevated above surface based on distance to form natural parabolic flight path
      const distance = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const elevation = GLOBE_RADIUS * (1.07 + Math.min(distance / (GLOBE_RADIUS * 2), 0.42));
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      // Glowing lime-white track (exact like Image 2)
      const curveMat = new THREE.LineBasicMaterial({
        color: arc.color || '#bbf7d0',
        transparent: true,
        opacity: 0.82,
        linewidth: 1.8,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcsGroup.add(arcLine);

      // Glowing traveling data pulse
      const pulseGeo = new THREE.SphereGeometry(arc.pulseSize || 0.07, 12, 12);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.copy(p1);
      arcsGroup.add(pulseMesh);

      arcPulses.push({
        mesh: pulseMesh,
        curve,
        progress: Math.random(),
        speed: 0.0032 * arc.speed,
      });
    });
    arcPulsesRef.current = arcPulses;

    // 12. Animation Loop
    function animate() {
      // Rotate atmosphere view vector
      if (cameraRef.current && atmosphereMaterial.uniforms) {
        atmosphereMaterial.uniforms.viewVector.value.subVectors(
          cameraRef.current.position,
          atmosphereMesh.position,
        );
      }

      // Handle Globe Rotation / Inertia
      if (globeGroupRef.current) {
        // Target interpolation (Fly to selected continent)
        if (targetRotationRef.current) {
          const target = targetRotationRef.current;
          globeGroupRef.current.rotation.y += (target.y - globeGroupRef.current.rotation.y) * 0.08;
          globeGroupRef.current.rotation.x += (target.x - globeGroupRef.current.rotation.x) * 0.08;

          // Once close, release target
          if (
            Math.abs(target.y - globeGroupRef.current.rotation.y) < 0.001 &&
            Math.abs(target.x - globeGroupRef.current.rotation.x) < 0.001
          ) {
            targetRotationRef.current = null;
          }
        } else if (!isDraggingRef.current) {
          // Inertia damping
          globeGroupRef.current.rotation.y += velocityRef.current.x;
          globeGroupRef.current.rotation.x += velocityRef.current.y;
          velocityRef.current.x *= 0.94;
          velocityRef.current.y *= 0.94;

          // Subtle auto-rotation when stationary
          if (
            isAutoRotatingRef.current &&
            Math.abs(velocityRef.current.x) < 0.0001 &&
            Math.abs(velocityRef.current.y) < 0.0001
          ) {
            globeGroupRef.current.rotation.y += autoRotateSpeed;
          }
        }

        // Clamp vertical tilt so world doesn't flip
        globeGroupRef.current.rotation.x = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, globeGroupRef.current.rotation.x),
        );
      }

      // Animate Arcs Data Pulses
      if (showArcs) {
        arcPulses.forEach((arc) => {
          arc.progress = (arc.progress + arc.speed) % 1.0;
          const currentPoint = arc.curve.getPoint(arc.progress);
          arc.mesh.position.copy(currentPoint);
        });
      }

      // Smooth Camera Distance (Zoom) Interpolation
      if (cameraRef.current) {
        const currentDist = cameraRef.current.position.length();
        const targetDist = targetDistanceRef.current;
        if (Math.abs(targetDist - currentDist) > 0.005) {
          const newDist = currentDist + (targetDist - currentDist) * 0.12;
          cameraRef.current.position.setLength(newDist);
        }
      }

      // Update 3D Floating Continent Labels Visibility & Line-of-sight Occlusion
      if (cameraRef.current && globeGroupRef.current) {
        const cameraPos = cameraRef.current.position;
        labelSpritesRef.current.forEach((sprite) => {
          const worldPos = new THREE.Vector3();
          sprite.getWorldPosition(worldPos);
          const toCamera = cameraPos.clone().sub(worldPos).normalize();
          // The globe is at origin (0, 0, 0), so the radial surface normal in world space is worldPos normalized
          const normal = worldPos.clone().normalize();
          const dot = normal.dot(toCamera);

          if (dot > 0.08) {
            sprite.visible = true;
            (sprite.material as THREE.SpriteMaterial).opacity = Math.min(1.0, (dot - 0.08) * 3.8);
          } else {
            sprite.visible = false;
          }
        });
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    }

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 13. Container & Window Resize Handler
    function handleResize() {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newWidth = container.clientWidth || 800;
      const newHeight = container.clientHeight || 520;
      if (newWidth === 0 || newHeight === 0) return;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    // Trigger immediate resize check on next tick to catch modal transitions
    setTimeout(handleResize, 50);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      labelSprites.forEach((sp) => {
        sp.material.map?.dispose();
        sp.material.dispose();
      });
      renderer.dispose();
    };
  }, [isDark, autoRotateSpeed, showArcs, initialTheme]);

  // Live Theme Switching Effect
  useEffect(() => {
    if (!earthMaterialRef.current) return;
    const palette = THEME_PALETTES[currentTheme];
    const newTexture = createEarthCanvasTexture(currentTheme);

    if (earthMaterialRef.current.map) {
      earthMaterialRef.current.map.dispose();
    }
    earthMaterialRef.current.map = newTexture;
    earthMaterialRef.current.roughness = palette.specularShininess;
    earthMaterialRef.current.needsUpdate = true;

    if (atmosphereMaterialRef.current?.uniforms?.color) {
      atmosphereMaterialRef.current.uniforms.color.value.set(palette.atmosphereColor);
      atmosphereMaterialRef.current.uniforms.opacity.value = palette.atmosphereOpacity;
    }
  }, [currentTheme]);

  // Smoothly rotate globe to face a specific continent
  const flyToContinent = useCallback((continent: ContinentNode) => {
    setSelectedContinent(continent);
    if (!globeGroupRef.current) return;

    // Convert continent latitude/longitude to target rotation
    // Longitude moves rotation.y, latitude moves rotation.x
    const targetY = -((continent.lng + 90) * (Math.PI / 180));
    const targetX = (continent.lat * 0.6) * (Math.PI / 180);

    // Shortest rotational delta
    const currentY = globeGroupRef.current.rotation.y % (Math.PI * 2);
    let diff = (targetY - currentY) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    targetRotationRef.current = {
      y: globeGroupRef.current.rotation.y + diff,
      x: targetX,
    };

    onSelectContinent?.(continent);
  }, [onSelectContinent]);

  // Zoom Controls
  const handleZoomIn = useCallback(() => {
    targetDistanceRef.current = Math.max(MIN_DISTANCE, targetDistanceRef.current - 2.0);
  }, [MIN_DISTANCE]);

  const handleZoomOut = useCallback(() => {
    targetDistanceRef.current = Math.min(MAX_DISTANCE, targetDistanceRef.current + 2.0);
  }, [MAX_DISTANCE]);

  // Keyboard shortcuts (+ / -) for Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  // Mouse & Touch Drag Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    targetRotationRef.current = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current || !globeGroupRef.current) return;

    if (isDraggingRef.current) {
      const moveDist = Math.hypot(
        e.clientX - pointerStartPosRef.current.x,
        e.clientY - pointerStartPosRef.current.y
      );
      if (moveDist > 5) {
        hasDraggedRef.current = true;
      }

      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;

      const rotSpeed = 0.0055;
      globeGroupRef.current.rotation.y += deltaX * rotSpeed;
      globeGroupRef.current.rotation.x += deltaY * rotSpeed;

      velocityRef.current = {
        x: deltaX * rotSpeed * 0.5,
        y: deltaY * rotSpeed * 0.5,
      };

      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Raycasting for Continent & Beacon Hover Detection
      const rect = container.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      setMouseCoords({ x: localX, y: localY });
      const mouseX = (localX / rect.width) * 2 - 1;
      const mouseY = -(localY / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      // Check continent colliders and beacon caps
      const hitTargets = [...beaconMeshesRef.current, ...continentHitMeshesRef.current];
      const intersects = raycaster.intersectObjects(hitTargets, false);

      let foundContinent: ContinentNode | null = null;
      if (intersects.length > 0) {
        foundContinent = (intersects[0].object.userData?.continent as ContinentNode) || null;
      }

      // Fallback: Check intersection with Earth surface directly
      if (!foundContinent && earthMeshRef.current) {
        const earthHits = raycaster.intersectObject(earthMeshRef.current, false);
        if (earthHits.length > 0) {
          const localPoint = globeGroupRef.current.worldToLocal(earthHits[0].point.clone());
          foundContinent = findClosestContinent(localPoint, GLOBE_RADIUS, 3.2);
        }
      }

      if (foundContinent) {
        setHoveredContinent(foundContinent);
        container.style.cursor = 'pointer';
        return;
      }

      setHoveredContinent(null);
      container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If pointer was dragged to rotate the globe, do not treat as a continent click
    if (hasDraggedRef.current) return;

    const container = containerRef.current;
    if (!container || !cameraRef.current || !globeGroupRef.current) return;
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    // 1. Raycast against continent hit colliders and beacon targets
    const hitTargets = [...beaconMeshesRef.current, ...continentHitMeshesRef.current];
    const intersects = raycaster.intersectObjects(hitTargets, false);

    let clickedContinent: ContinentNode | null = null;
    if (intersects.length > 0) {
      clickedContinent = (intersects[0].object.userData?.continent as ContinentNode) || null;
    }

    // 2. Fallback: Raycast directly onto Earth surface and find closest continent
    if (!clickedContinent && earthMeshRef.current) {
      const earthHits = raycaster.intersectObject(earthMeshRef.current, false);
      if (earthHits.length > 0) {
        const localPoint = globeGroupRef.current.worldToLocal(earthHits[0].point.clone());
        clickedContinent = findClosestContinent(localPoint, GLOBE_RADIUS, 3.6);
      }
    }

    if (clickedContinent) {
      // If clicking already-focused continent, directly launch that sidebar route!
      if (selectedContinent?.id === clickedContinent.id) {
        router.push(clickedContinent.route);
      } else {
        flyToContinent(clickedContinent);
      }
    }
  };

  // Zoom / Wheel support with smooth target interpolation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.008;
    targetDistanceRef.current = Math.max(
      MIN_DISTANCE,
      Math.min(MAX_DISTANCE, targetDistanceRef.current + zoomDelta)
    );
  };

  const resetView = () => {
    targetRotationRef.current = { x: 0.32, y: -1.25 };
    targetDistanceRef.current = DEFAULT_DISTANCE;
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, DEFAULT_DISTANCE);
    }
    setSelectedContinent(null);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden select-none transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none bg-zinc-950 flex flex-col'
          : 'bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl'
      } ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Overlay Banner: Telemetry & Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-xs shadow-lg pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-zinc-300 font-semibold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            {selectedContinent ? (
              <span>
                <strong className="text-white tracking-normal font-bold">{selectedContinent.name}</strong>
                <span className="text-zinc-500 mx-1.5">/</span>
                <span className="text-cyan-400 font-medium normal-case">{selectedContinent.sidebarTitle}</span>
              </span>
            ) : hoveredContinent ? (
              <span>
                <strong className="text-white tracking-normal font-bold">{hoveredContinent.name}</strong>
                <span className="text-zinc-500 mx-1.5">/</span>
                <span className="text-cyan-400 font-medium normal-case">{hoveredContinent.sidebarTitle}</span>
              </span>
            ) : (
              <span>3D World Navigation · Continents</span>
            )}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom In & Zoom Out Controls */}
          <div className="flex items-center bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-0.5 shadow-lg">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+ / Scroll Up)"
              aria-label="Zoom In"
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-3.5 bg-zinc-800" />
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (- / Scroll Down)"
              aria-label="Zoom Out"
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Palette Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Change Globe Color Theme"
              className={`p-2 rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
                showThemePicker
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
            </button>
            {showThemePicker && (
              <div className="absolute top-12 right-0 w-56 p-2 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl z-30 space-y-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Globe Color Scheme
                </div>
                {Object.values(THEME_PALETTES).map((pal) => (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => {
                      setCurrentTheme(pal.id);
                      setShowThemePicker(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      currentTheme === pal.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{pal.name}</div>
                      <div className="text-[10px] text-zinc-500">{pal.badge}</div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: pal.landStroke }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? 'Pause rotation' : 'Resume auto rotation'}
            className={`p-2 rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
              isAutoRotating
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowArcs(!showArcs)}
            title="Toggle News Dispatch Arcs"
            className={`p-2 rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
              showArcs
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            title="Reset Perspective"
            className="p-2 rounded-xl bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D World'}
            className="p-2 rounded-xl bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Continent Quick-Selector Chips */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none z-10 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none pointer-events-auto">
          {CONTINENTS.map((cont) => {
            const isCurrent = selectedContinent?.id === cont.id;
            return (
              <button
                key={cont.id}
                onClick={() => flyToContinent(cont)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                  isCurrent
                    ? 'bg-white text-zinc-950 border-white shadow-lg shadow-white/10 scale-105'
                    : 'bg-zinc-900/70 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cont.color }}
                />
                <span className="font-bold text-white">{cont.name}</span>
                <span className="text-[10px] text-cyan-400 font-normal opacity-90">({cont.sidebarTitle})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Cursor Floating Badge for Continent */}
      {hoveredContinent && !selectedContinent && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-cyan-500/40 shadow-xl shadow-cyan-500/10 flex items-center gap-2 animate-in fade-in duration-100"
          style={{ left: mouseCoords.x, top: mouseCoords.y - 12 }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: hoveredContinent.color }}
          />
          <span className="font-bold text-white text-xs uppercase tracking-wider">
            {hoveredContinent.name}
          </span>
          <span className="text-[10px] text-cyan-400 font-medium">
            • {hoveredContinent.sidebarTitle}
          </span>
        </div>
      )}

      {/* Floating Interactive Continent Detail Popover */}
      {(selectedContinent || hoveredContinent) && (
        <div className="absolute top-16 right-4 w-80 p-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl text-white z-20 space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
          {(() => {
            const active = selectedContinent || hoveredContinent!;
            return (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                      style={{
                        borderColor: `${active.color}40`,
                        backgroundColor: `${active.color}15`,
                        color: active.glowColor,
                      }}
                    >
                      {active.name}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-400" />
                      {active.sidebarTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      {active.lat > 0 ? `${active.lat}°N` : `${Math.abs(active.lat)}°S`},{' '}
                      {active.lng > 0 ? `${active.lng}°E` : `${Math.abs(active.lng)}°W`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContinent(null);
                        setHoveredContinent(null);
                      }}
                      title="Close"
                      aria-label="Close"
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {active.description}
                </p>

                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400">{active.stats.label}:</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {active.stats.value}
                  </span>
                </div>

                <div className="pt-1 space-y-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center gap-2 font-semibold shadow-md cursor-pointer"
                    onClick={() => router.push(active.route)}
                  >
                    <span>Launch {active.sidebarTitle}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <p className="text-[10px] text-zinc-400 text-center">
                    Tip: Click continent again or click button to open desk
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
