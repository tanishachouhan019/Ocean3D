import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Helper: Draw Detailed Equirectangular Earth Map onto Canvas ──
function createEarthCanvasTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep Oceanic Blue Base Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#020b18');
  oceanGrad.addColorStop(0.25, '#041d3d');
  oceanGrad.addColorStop(0.5, '#072b54');
  oceanGrad.addColorStop(0.75, '#041d3d');
  oceanGrad.addColorStop(1, '#020b18');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Lat/Lon to Canvas pixel coordinates
  const toXY = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  const drawPolygon = (
    pts: [number, number][],
    fillColor = '#1a382b',
    strokeColor = '#38bdf8',
    strokeWidth = 1.5
  ) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    const [startX, startY] = toXY(pts[0][0], pts[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = toXY(pts[i][0], pts[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  };

  // 2. Real-World Continent Outlines
  // India & S. Asia
  drawPolygon(
    [
      [68, 24], [73, 22], [77, 8], [80, 13], [88, 22],
      [92, 26], [88, 27], [80, 26], [72, 24], [68, 24]
    ],
    '#1e3e30', '#38bdf8', 2
  );

  // Arabian Peninsula
  drawPolygon(
    [
      [44, 12], [54, 16], [59, 22], [55, 27], [48, 30],
      [35, 30], [32, 28], [43, 13], [44, 12]
    ],
    '#254536', '#38bdf8', 1.8
  );

  // Africa
  drawPolygon(
    [
      [32, 31], [43, 12], [51, 11], [41, 0], [39, -5],
      [35, -20], [20, -34], [18, -34], [12, -15], [9, 4],
      [-17, 14], [-17, 21], [-6, 36], [10, 37], [25, 31], [32, 31]
    ],
    '#1c3a2d', '#0ea5e9', 1.8
  );

  // Eurasia (Europe & Asia)
  drawPolygon(
    [
      [-9, 38], [-9, 43], [5, 43], [10, 54], [25, 60],
      [32, 70], [70, 73], [140, 72], [170, 65], [140, 50],
      [120, 30], [105, 10], [98, 15], [75, 30], [60, 40],
      [40, 40], [35, 36], [28, 41], [25, 35], [14, 45],
      [3, 43], [-5, 36], [-9, 38]
    ],
    '#1a382a', '#0ea5e9', 1.8
  );

  // North America
  drawPolygon(
    [
      [-168, 65], [-140, 60], [-125, 49], [-120, 34], [-105, 20],
      [-90, 15], [-80, 8], [-77, 8], [-80, 25], [-64, 45],
      [-55, 50], [-65, 65], [-80, 72], [-120, 75], [-168, 65]
    ],
    '#193729', '#0284c7', 1.6
  );

  // South America
  drawPolygon(
    [
      [-80, 8], [-75, 11], [-60, 12], [-35, -5], [-38, -18],
      [-50, -35], [-68, -55], [-75, -45], [-80, -20], [-80, 0], [-80, 8]
    ],
    '#1b392b', '#0284c7', 1.6
  );

  // Australia
  drawPolygon(
    [
      [114, -22], [130, -12], [142, -10], [153, -28],
      [148, -38], [117, -35], [114, -22]
    ],
    '#204031', '#38bdf8', 1.6
  );

  // Greenland
  drawPolygon(
    [
      [-55, 60], [-40, 60], [-20, 70], [-30, 82], [-60, 78], [-55, 60]
    ],
    '#334155', '#94a3b8', 1.2
  );

  // Antarctica
  drawPolygon(
    [
      [-180, -65], [180, -65], [180, -90], [-180, -90], [-180, -65]
    ],
    '#334155', '#cbd5e1', 1.2
  );

  // Madagascar
  drawPolygon([[43, -12], [50, -15], [47, -25], [43, -25], [43, -12]], '#1c3a2d', '#38bdf8', 1.2);
  // UK
  drawPolygon([[-10, 50], [2, 50], [0, 58], [-6, 58], [-10, 50]], '#1a382a', '#0ea5e9', 1.2);
  // Japan
  drawPolygon([[130, 31], [140, 35], [142, 44], [138, 44], [130, 31]], '#1a382a', '#38bdf8', 1.2);

  // 3. Subtle Ocean Heat Zone Gradients (Equatorial Warm Pool & Upwelling)
  ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
  const [eqX, eqY] = toXY(65, 10);
  const heatGrad = ctx.createRadialGradient(eqX, eqY, 20, eqX, eqY, 280);
  heatGrad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
  heatGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
  heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = heatGrad;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}

export default function Ocean3DGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6.8);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // Main Globe Group
    const globeGroup = new THREE.Group();
    // Position Arabian Sea / India facing forward initially
    globeGroup.rotation.y = -Math.PI / 1.65;
    globeGroup.rotation.x = 0.22;
    scene.add(globeGroup);

    // 3. Starfield Space Background
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 12 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const c = new THREE.Color();
      c.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.7 + Math.random() * 0.3);
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0a2040, 2.2);
    scene.add(ambientLight);

    // Key Specular Sun Light
    const sunLight = new THREE.DirectionalLight(0xf0f9ff, 3.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Secondary Back/Rim Light
    const rimLight = new THREE.PointLight(0x0284c7, 3.2, 25);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 5. Create 3D Earth Sphere Geometry & Material
    const earthGeo = new THREE.SphereGeometry(2.0, 64, 64);

    const fallbackCanvas = createEarthCanvasTexture();
    const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);
    fallbackTexture.colorSpace = THREE.SRGBColorSpace;

    const earthMat = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0x020d20,
      emissiveIntensity: 0.6,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Load High-Res Satellite Earth Texture from official Three.js CDN
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_atmos_2048.jpg',
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = loadedTexture;
        earthMat.needsUpdate = true;
      }
    );

    // 6. Thin Cyan/Teal Atmospheric Rim Glow (Fresnel Glow)
    const atmosphereGeo = new THREE.SphereGeometry(2.14, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * vec4(vPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(1.0 - abs(dot(vNormal, viewDir)), 2.8);
          vec3 glowColor = mix(vec3(0.02, 0.75, 0.98), vec3(0.04, 0.9, 0.85), intensity);
          gl_FragColor = vec4(glowColor, intensity * 0.78);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 7. Futuristic Outer Orbital Tech Rings (Matching Reference Design)
    const ringGroup = new THREE.Group();

    // Ring 1: Main Equatorial Tech Ring
    const ring1Geo = new THREE.TorusGeometry(2.32, 0.008, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    ringGroup.add(ring1);

    // Ring 2: Tilted Cyan Orbit Ring
    const ring2Geo = new THREE.TorusGeometry(2.5, 0.006, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3.2;
    ring2.rotation.y = Math.PI / 6;
    ringGroup.add(ring2);

    // Ring 3: Concentric Dashed Outer Halo Ring
    const ring3Geo = new THREE.TorusGeometry(2.68, 0.005, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 1.8;
    ringGroup.add(ring3);

    scene.add(ringGroup);

    // 8. Cybernetic Bottom Platform Base Pedestal (Matching Reference Design)
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, -2.35, 0);

    const baseRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.02, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
    );
    baseRing1.rotation.x = Math.PI / 2;
    platformGroup.add(baseRing1);

    const baseRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.015, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.6 })
    );
    baseRing2.rotation.x = Math.PI / 2;
    platformGroup.add(baseRing2);

    const baseRing3 = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.01, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35 })
    );
    baseRing3.rotation.x = Math.PI / 2;
    platformGroup.add(baseRing3);

    scene.add(platformGroup);

    // 9. Lat/Lon Geographic Grid Lines Overlay
    const gridGeo = new THREE.SphereGeometry(2.012, 36, 18);
    const gridWireframe = new THREE.WireframeGeometry(gridGeo);
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.18,
    });
    const gridLines = new THREE.LineSegments(gridWireframe, gridMat);
    globeGroup.add(gridLines);

    // 10. Ocean Currents & Constellation Network Nodes on Arabian Sea
    const latLonToVector3 = (lat: number, lon: number, radius = 2.025) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Connected Telemetry Constellation Nodes on Arabian Sea / Indian Ocean
    const nodeCoords = [
      { lat: 15.2, lon: 68.4 },
      { lat: 11.5, lon: 72.1 },
      { lat: 18.8, lon: 64.2 },
      { lat: 7.4, lon: 76.8 },
      { lat: 21.1, lon: 69.8 },
      { lat: 14.0, lon: 74.0 },
      { lat: 9.0, lon: 65.0 },
    ];

    const constellationGroup = new THREE.Group();
    const nodePositions = nodeCoords.map((c) => latLonToVector3(c.lat, c.lon, 2.03));

    // Draw glowing node points
    nodePositions.forEach((pos) => {
      const pGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      const ringGeo = new THREE.RingGeometry(0.04, 0.08, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      const g = new THREE.Group();
      g.add(pMesh);
      g.add(ringMesh);
      constellationGroup.add(g);
    });

    // Draw connecting mesh lines between nodes
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
        const line = new THREE.Line(lineGeo, lineMat);
        constellationGroup.add(line);
      }
    }

    globeGroup.add(constellationGroup);

    // 11. Smooth Rotation & Interactive Mouse Drag
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        globeGroup.rotation.y += deltaX * 0.005;
        globeGroup.rotation.x += deltaY * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 12. Animation Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Continuous Earth rotation (working rotation!)
      if (!isDragging) {
        globeGroup.rotation.y += 0.0028;
      }

      starField.rotation.y -= 0.0004;
      ringGroup.rotation.z += 0.001;
      ringGroup.rotation.y += 0.0005;
      platformGroup.rotation.z += 0.002;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    />
  );
}
