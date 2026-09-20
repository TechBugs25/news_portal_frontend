import * as THREE from 'three';

/**
 * Atmospheric Rim / Fresnel Glow Shader for the 3D Globe
 * Recreates the luminous cyan/blue atmospheric limb visible in the reference photo.
 */
export function createAtmosphereMaterial(color = '#38bdf8', opacity = 0.6) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      viewVector: { value: new THREE.Vector3() },
      opacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        // Fresnel factor: high on the rim, fades towards the center
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);
        gl_FragColor = vec4(color, intensity * opacity);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}
