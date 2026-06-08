/**
 * 3D Treehouse Cafe Scene Setup - Daytime Forest Waterfall Version
 * Procedural modeling of the treehouse, cozy cabin interior, lighting, shadows,
 * rock cliff, cascading waterfall, forest valley background, splashing mist,
 * and high-fidelity jointed teakwood mannequins.
 */

// Global 3D objects
let scene, camera, renderer, orbitControls, composer;
let treeGroup, firefliesGroup, steamParticles;
const stringLightGroups = [];
let cabinDoorHinge;
let waterfallTexture;
let waterfallSplashParticles;
let playerShadow;
const interactiveTables = [];
window.tableRegistry = {};
window.walkBob = 0;
window.scrollWalkActive = true;

window.highlightTable = function (id, on) {
    const t = window.tableRegistry[id];
    if (!t) return;
    if (t.ring) {
        t.ring.visible = on;
        t.ring.material.opacity = on ? 0.85 : 0;
    }
    if (t.lamp) {
        t.lamp.material.emissiveIntensity = on ? 2.5 : 1.2;
        t.lamp.material.color.setHex(on ? 0xffdd44 : 0x44dd66);
        t.lamp.material.emissive.setHex(on ? 0xcc9900 : 0x119933);
    }
    if (t.sign) t.sign.visible = on;
};

// --- Procedural texture helpers ---
function createWoodTexture(hex = '#8a6245', grainCount = 80) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const base = parseInt(hex.replace('#', ''), 16);
    const r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < grainCount; i++) {
        const y = Math.random() * 512;
        const shade = 0.75 + Math.random() * 0.35;
        ctx.strokeStyle = `rgba(${r * shade},${g * shade},${b * shade},${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < 512; x += 8) {
            ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 4);
        }
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

function createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * 256;
        ctx.fillStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 25},${10 + Math.random() * 15},${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(x, 0, 2 + Math.random() * 6, 512);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2d5a35';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const g = 80 + Math.random() * 100;
        ctx.fillStyle = `rgba(${30 + Math.random() * 20},${g},${40 + Math.random() * 30},0.6)`;
        ctx.fillRect(x, y, 1, 2 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
}

function createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(180, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color('#6eb5e8') },
            horizonColor: { value: new THREE.Color('#c8e8d8') },
            bottomColor: { value: new THREE.Color('#e8f4ec') }
        },
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 horizonColor;
            uniform vec3 bottomColor;
            varying vec3 vWorldPos;
            void main() {
                float h = normalize(vWorldPos).y;
                vec3 col = h > 0.0
                    ? mix(horizonColor, topColor, pow(h, 0.45))
                    : mix(horizonColor, bottomColor, pow(-h, 0.6));
                gl_FragColor = vec4(col, 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));
}

function createTerrain() {
    const grassTex = createGrassTexture();
    const groundGeo = new THREE.PlaneGeometry(120, 120, 48, 48);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const hill = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 1.2;
        const valley = Math.exp(-dist * 0.04) * 0.8;
        pos.setY(i, hill - valley + (Math.random() - 0.5) * 0.15);
    }
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.92,
        metalness: 0.02,
        color: 0x3d6b42
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Mossy rocks scattered on ground
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: 0.95 });
    for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 35;
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.6, 0),
            rockMat
        );
        rock.position.set(Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.5 + Math.random() * 0.5;
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }
}

function createStringLights(parent, radius, height, count) {
    const stringLightsGroup = new THREE.Group();
    const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfff4d0, emissive: 0xffb84d, emissiveIntensity: 1.5, roughness: 0.3
    });
    for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const angle = Math.PI * 0.35 + t * Math.PI * 1.3;
        const sag = Math.sin(t * Math.PI) * 0.35;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), bulbMat);
        bulb.position.set(Math.cos(angle) * radius, height - sag, Math.sin(angle) * radius);
        stringLightsGroup.add(bulb);
        if (i % 3 === 0) {
            const glow = new THREE.PointLight(0xffc870, 0.25, 3, 2);
            glow.position.copy(bulb.position);
            stringLightsGroup.add(glow);
        }
    }
    // Wire between bulbs
    const wirePoints = [];
    for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const angle = Math.PI * 0.35 + t * Math.PI * 1.3;
        const sag = Math.sin(t * Math.PI) * 0.35;
        wirePoints.push(new THREE.Vector3(Math.cos(angle) * radius, height - sag, Math.sin(angle) * radius));
    }
    const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
    const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x333333 }));
    stringLightsGroup.add(wire);
    parent.add(stringLightsGroup);
    stringLightGroups.push(stringLightsGroup);
}

function createCafeDetails(deck1Group, woodDeckMaterial) {
    // Potted fern
    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.1, 0.18, 10),
        new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.8 })
    );
    pot.position.set(1.5, 0.09, -2.8);
    deck1Group.add(pot);
    for (let i = 0; i < 5; i++) {
        const frond = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.5 + Math.random() * 0.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x2d6b3a, roughness: 0.75 })
        );
        frond.position.set(1.5 + (Math.random() - 0.5) * 0.15, 0.35, -2.8 + (Math.random() - 0.5) * 0.15);
        frond.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
        deck1Group.add(frond);
    }

    // Pastry display case
    const caseGroup = new THREE.Group();
    caseGroup.position.set(0.8, 0.2, -2.2);
    caseGroup.rotation.y = Math.PI / 6;
    const caseBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.7, 0.5),
        woodDeckMaterial
    );
    caseBase.position.y = 0.35;
    caseGroup.add(caseBase);
    const caseGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.45, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xd6ecef, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.9 })
    );
    caseGlass.position.y = 0.72;
    caseGroup.add(caseGlass);
    const pastryColors = [0xd4a574, 0xc87850, 0xe8c878, 0xb85c38];
    for (let i = 0; i < 4; i++) {
        const pastry = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 6),
            new THREE.MeshStandardMaterial({ color: pastryColors[i], roughness: 0.6 })
        );
        pastry.position.set(-0.2 + i * 0.14, 0.72, 0);
        pastry.scale.y = 0.7;
        caseGroup.add(pastry);
    }
    deck1Group.add(caseGroup);

    // Coffee mugs on counter
    for (let i = 0; i < 3; i++) {
        const mug = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, 0.07, 10),
            new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.35 })
        );
        mug.position.set(-2.3 + i * 0.18, 1.42, -1.55);
        deck1Group.add(mug);
    }

    // Bunting flags
    const flagColors = [0xc2871b, 0x2d6b3a, 0xd4a574, 0x8a6245, 0x1b4527];
    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const angle = Math.PI * 0.5 + t * Math.PI * 1.1;
        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.25, 0.18),
            new THREE.MeshStandardMaterial({ color: flagColors[i % flagColors.length], side: THREE.DoubleSide, roughness: 0.8 })
        );
        flag.position.set(Math.cos(angle) * 4.1, 3.8, Math.sin(angle) * 4.1);
        flag.lookAt(0, 3.8, 0);
        deck1Group.add(flag);
    }
}

function setupPostProcessing() {
    if (typeof THREE.EffectComposer === 'undefined') return;
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.22, 0.4, 0.92
    );
    composer.addPass(bloom);
}

function updateLoaderProgress(pct) {
    const bar = document.getElementById('loader-progress');
    if (bar) bar.style.width = pct + '%';
}

function hideLoader() {
    updateLoaderProgress(100);
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    screen.classList.add('fade-out');
    setTimeout(() => screen.remove(), 800);
}

// Initialize Scene
function init3DScene() {
    const canvas = document.getElementById('webgl-canvas');
    updateLoaderProgress(10);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#d4e0d8', 0.014);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 15, 28);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputEncoding = THREE.sRGBEncoding;

    updateLoaderProgress(25);
    createSkyDome();
    createTerrain();

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.06;
    orbitControls.enableZoom = true;
    orbitControls.minDistance = 6;
    orbitControls.maxDistance = 50;
    orbitControls.minPolarAngle = Math.PI / 8;
    orbitControls.maxPolarAngle = Math.PI / 1.75;
    orbitControls.enabled = false;

    updateLoaderProgress(40);
    setupLighting();
    updateLoaderProgress(55);
    buildTreehouse();
    updateLoaderProgress(85);
    setupPostProcessing();
    updateLoaderProgress(95);

    animate();
    window.addEventListener('resize', onWindowResize);
    hideLoader();
}

// Setup Lighting
function setupLighting() {
    const sunlight = new THREE.DirectionalLight('#fff4e0', 2.2);
    sunlight.position.set(30, 50, 20);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.bias = -0.0005;
    sunlight.shadow.camera.left = -25;
    sunlight.shadow.camera.right = 25;
    sunlight.shadow.camera.top = 25;
    sunlight.shadow.camera.bottom = -25;
    sunlight.shadow.camera.near = 5;
    sunlight.shadow.camera.far = 120;
    scene.add(sunlight);

    const fillLight = new THREE.DirectionalLight('#b8d4f0', 0.4);
    fillLight.position.set(-20, 25, -15);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight('#f0ebe3', 0.55));
    scene.add(new THREE.HemisphereLight('#c8dce8', '#4a6741', 0.38));

    const warmInterior = new THREE.PointLight('#ffdcb0', 0.6, 18, 1.6);
    warmInterior.position.set(0, 10, 0);
    scene.add(warmInterior);
}

function createShingleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a3c32';
    ctx.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 8; col++) {
            const shade = 0.85 + Math.random() * 0.25;
            ctx.fillStyle = `rgb(${Math.floor(74 * shade)},${Math.floor(60 * shade)},${Math.floor(50 * shade)})`;
            const ox = (row % 2) * 16;
            ctx.fillRect(col * 32 + ox, row * 16, 30, 14);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
}

function createPlankDeck(width, depth, woodMat, boardW = 0.45) {
    const deck = new THREE.Group();
    const rows = Math.ceil(depth / boardW);
    const cols = Math.ceil(width / boardW);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const plank = new THREE.Mesh(
                new THREE.BoxGeometry(boardW - 0.02, 0.06, boardW - 0.01),
                woodMat
            );
            plank.position.set(
                -width / 2 + boardW / 2 + c * boardW,
                0.03,
                -depth / 2 + boardW / 2 + r * boardW
            );
            plank.castShadow = true;
            plank.receiveShadow = true;
            deck.add(plank);
        }
    }
    const frameMat = woodMat.clone();
    frameMat.color.multiplyScalar(0.85);
    [[0, -depth / 2], [0, depth / 2], [-width / 2, 0], [width / 2, 0]].forEach(([fx, fz], i) => {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(i < 2 ? width + 0.2 : 0.18, 0.22, i < 2 ? 0.18 : depth + 0.2),
            frameMat
        );
        beam.position.set(fx, -0.06, fz);
        beam.castShadow = true;
        deck.add(beam);
    });
    return deck;
}

function buildRealisticTrunk(barkMaterial, treeGroup) {
    const trunkGeo = new THREE.CylinderGeometry(1.1, 1.9, 26, 16, 6);
    trunkGeo.translate(0, 13, 0);
    const trunk = new THREE.Mesh(trunkGeo, barkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.3;
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 3.5, 8), barkMaterial);
        root.position.set(Math.cos(angle) * 1.6, 0.8, Math.sin(angle) * 1.6);
        root.rotation.z = Math.cos(angle) * 0.7;
        root.rotation.x = Math.sin(angle) * 0.7;
        root.castShadow = true;
        treeGroup.add(root);
    }
}

// Build Model
function buildTreehouse() {
    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    // --- MATERIALS ---
    const barkTex = createBarkTexture();
    const woodTex = createWoodTexture('#8a6245');
    const barkMaterial = new THREE.MeshStandardMaterial({ map: barkTex, color: 0x6a4a32, roughness: 0.88, metalness: 0.04 });
    const woodDeckMaterial = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x9a7255, roughness: 0.62, metalness: 0.08 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2a7a3e, roughness: 0.72, transparent: true, opacity: 0.9 });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8f8fc, roughness: 0.02, metalness: 0.92,
        transparent: true, opacity: 0.18,
        envMapIntensity: 1.2
    });
    const ironMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.45, metalness: 0.85 });
    const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xdca642, roughness: 0.25, metalness: 0.95 });

    // --- 1. BACKGROUND WATERFALL & ROCK CLIFF ---
    const cliffGroup = new THREE.Group();
    cliffGroup.position.set(2, 0, -14); // Position behind the treehouse
    scene.add(cliffGroup);

    // Giant jagged rocks (cliffside)
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x242729, roughness: 0.95 }); // Slate charcoal rock
    
    // Left Rock Block
    const rockL = new THREE.Mesh(new THREE.BoxGeometry(10, 32, 6), rockMat);
    rockL.position.set(-6, 16, 0);
    rockL.rotation.y = 0.1;
    rockL.castShadow = true;
    rockL.receiveShadow = true;
    cliffGroup.add(rockL);

    // Right Rock Block
    const rockR = new THREE.Mesh(new THREE.BoxGeometry(10, 32, 6), rockMat);
    rockR.position.set(8, 16, 0);
    rockR.rotation.y = -0.15;
    rockR.castShadow = true;
    rockR.receiveShadow = true;
    cliffGroup.add(rockR);

    // Deep center recession where waterfall flows
    const centerRock = new THREE.Mesh(new THREE.BoxGeometry(7, 32, 4), rockMat);
    centerRock.position.set(1.0, 16, -1.0);
    centerRock.receiveShadow = true;
    cliffGroup.add(centerRock);

    // Cascading Water Flow Mesh
    // Draw a procedural foam texture on a canvas
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 128;
    waterCanvas.height = 512;
    const waterCtx = waterCanvas.getContext('2d');
    
    // Draw cascading blue/white streaks
    waterCtx.fillStyle = '#4fa4cc';
    waterCtx.fillRect(0, 0, 128, 512);
    waterCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 128;
        const w = 2 + Math.random() * 6;
        const h = 50 + Math.random() * 150;
        const y = Math.random() * 512;
        waterCtx.fillRect(x, y, w, h);
    }
    
    waterfallTexture = new THREE.CanvasTexture(waterCanvas);
    waterfallTexture.wrapS = waterfallTexture.wrapT = THREE.RepeatWrapping;
    waterfallTexture.repeat.set(1, 1);

    const waterMat = new THREE.MeshStandardMaterial({
        map: waterfallTexture,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.1,
        emissive: 0xd6f7ff,
        emissiveIntensity: 0.6
    });

    const waterfallGeo = new THREE.PlaneGeometry(3.6, 27.5);
    const waterfall = new THREE.Mesh(waterfallGeo, waterMat);
    // Align waterfall flat against the center recessed rock cliff
    waterfall.position.set(1.0, 14.5, 1.05); // Y=14.5, Z=1.05 relative to cliff group
    cliffGroup.add(waterfall);

    // Splash Pool at base
    const poolGeo = new THREE.CylinderGeometry(3.0, 3.5, 0.3, 16);
    const poolMat = new THREE.MeshStandardMaterial({
        color: 0x4fa4cc,
        roughness: 0.1,
        transparent: true,
        opacity: 0.75,
        emissive: 0x2c6480,
        emissiveIntensity: 0.4
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(1.0, 0.1, 1.2);
    cliffGroup.add(pool);

    // Splashing Mist Particle System
    createWaterfallMist(cliffGroup, 1.0, 0.3, 1.2);

    // --- 2. DENSE BACKGROUND FOREST ---
    createDenseForest(barkMaterial, leafMaterial);

    // --- 3. MAIN TREE & TRUNK ---
    buildRealisticTrunk(barkMaterial, treeGroup);

    // Stairs
    const stairCount = 38;
    const stairGroup = new THREE.Group();
    const stairStepGeo = new THREE.BoxGeometry(1.6, 0.15, 0.4);
    
    for (let i = 0; i < stairCount; i++) {
        const theta = i * 0.28;
        const radius = 1.9 + (i * 0.005);
        const heightY = i * 0.35 + 0.5;
        
        const step = new THREE.Mesh(stairStepGeo, woodDeckMaterial);
        step.position.set(Math.cos(theta) * radius, heightY, Math.sin(theta) * radius);
        step.rotation.y = -theta + Math.PI/2;
        step.castShadow = true;
        step.receiveShadow = true;
        stairGroup.add(step);
    }
    treeGroup.add(stairGroup);

    // Rope handrail along stairs
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 });
    for (let i = 0; i < stairCount; i += 3) {
        const theta = i * 0.28;
        const radius = 1.9 + (i * 0.005);
        const heightY = i * 0.35 + 0.5;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), ropeMat);
        post.position.set(Math.cos(theta) * (radius + 0.5), heightY + 0.45, Math.sin(theta) * (radius + 0.5));
        treeGroup.add(post);
    }

    // TAB-style knee braces trunk → deck corners
    const braceCorners = [[-3.8, -2.8], [3.8, -2.8], [-3.8, 2.8], [3.8, 2.8]];
    braceCorners.forEach(([bx, bz]) => {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 5.5), woodDeckMaterial);
        brace.position.set(bx * 0.45, 4.2, bz * 0.45);
        brace.rotation.x = Math.atan2(7.5 - 1.5, 3.5) * (bz > 0 ? 1 : -1) * 0.3;
        brace.rotation.y = Math.atan2(bx, bz);
        brace.rotation.z = Math.atan2(7.5, Math.sqrt(bx * bx + bz * bz)) * 0.45;
        brace.castShadow = true;
        treeGroup.add(brace);
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.08, 0.35),
            ironMaterial
        );
        bracket.position.set(bx, 7.35, bz);
        treeGroup.add(bracket);
    });

    // Lower deck — rectangular plank platform
    const deck1Group = new THREE.Group();
    deck1Group.position.y = 7.5;
    const deckW = 9.0, deckD = 7.0;
    deck1Group.add(createPlankDeck(deckW, deckD, woodDeckMaterial));

    // Support joists underneath
    for (let i = -3; i <= 3; i++) {
        const joist = new THREE.Mesh(new THREE.BoxGeometry(deckW, 0.18, 0.14), woodDeckMaterial);
        joist.position.set(0, -0.22, i * 0.9);
        joist.castShadow = true;
        deck1Group.add(joist);
    }

    // Deck railing — wood posts + horizontal rails
    const railH = 0.95;
    const railPoints = [
        { x: -deckW / 2, z: -deckD / 2, len: deckW, axis: 'x' },
        { x: -deckW / 2, z: deckD / 2, len: deckW, axis: 'x' },
        { x: -deckW / 2, z: -deckD / 2, len: deckD, axis: 'z' },
        { x: deckW / 2, z: -deckD / 2, len: deckD, axis: 'z' }
    ];
    railPoints.forEach(r => {
        const steps = Math.floor(r.len / 0.8);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = r.axis === 'x' ? r.x + t * r.len : r.x;
            const pz = r.axis === 'z' ? r.z + t * r.len : r.z;
            if (pz > 2.0 && px > -1.5 && px < 2.5) continue; // skip door opening
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, railH, 0.07), woodDeckMaterial);
            post.position.set(px, railH / 2 + 0.06, pz);
            post.castShadow = true;
            deck1Group.add(post);
        }
        const rail = new THREE.Mesh(
            new THREE.BoxGeometry(r.axis === 'x' ? r.len : 0.06, 0.06, r.axis === 'z' ? r.len : 0.06),
            woodDeckMaterial
        );
        rail.position.set(
            r.axis === 'x' ? 0 : r.x,
            railH + 0.04,
            r.axis === 'z' ? 0 : r.z
        );
        deck1Group.add(rail);
    });

    // --- Cedar cabin (rectangular, not cylindrical) ---
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(0, 0.06, -0.4);
    const cabinW = 5.2, cabinD = 4.0, cabinH = 2.9;
    const sidingMat = new THREE.MeshStandardMaterial({
        map: createWoodTexture('#6b5040'), color: 0x7a5c48, roughness: 0.78
    });
    const shingleMat = new THREE.MeshStandardMaterial({
        map: createShingleTexture(), color: 0x4a3c32, roughness: 0.88
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x3d2e24, roughness: 0.8 });

    // Floor / interior base
    const floor = new THREE.Mesh(new THREE.BoxGeometry(cabinW - 0.2, 0.08, cabinD - 0.2), woodDeckMaterial);
    floor.position.y = 0.04;
    floor.receiveShadow = true;
    cabinGroup.add(floor);

    // Walls
    const wallT = 0.14;
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, wallT), sidingMat);
    backWall.position.set(0, cabinH / 2 + 0.08, -cabinD / 2);
    backWall.castShadow = true;
    cabinGroup.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, cabinH, cabinD), sidingMat);
    leftWall.position.set(-cabinW / 2, cabinH / 2 + 0.08, 0);
    leftWall.castShadow = true;
    cabinGroup.add(leftWall);
    const rightWall = leftWall.clone();
    rightWall.position.x = cabinW / 2;
    cabinGroup.add(rightWall);

    // Front wall with door cutout (split panels)
    const frontPanelL = new THREE.Mesh(new THREE.BoxGeometry(1.5, cabinH, wallT), sidingMat);
    frontPanelL.position.set(-1.85, cabinH / 2 + 0.08, cabinD / 2);
    cabinGroup.add(frontPanelL);
    const frontPanelR = new THREE.Mesh(new THREE.BoxGeometry(1.5, cabinH, wallT), sidingMat);
    frontPanelR.position.set(1.85, cabinH / 2 + 0.08, cabinD / 2);
    cabinGroup.add(frontPanelR);
    const frontPanelTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, wallT), sidingMat);
    frontPanelTop.position.set(0, cabinH - 0.27, cabinD / 2);
    cabinGroup.add(frontPanelTop);

    // Large windows with wood frames
    function addWindow(wx, wz, ww, wh, rotY = 0) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.12, wh + 0.12, 0.08), trimMat);
        frame.position.set(wx, cabinH / 2 + 0.1, wz);
        frame.rotation.y = rotY;
        cabinGroup.add(frame);
        const pane = new THREE.Mesh(
            new THREE.BoxGeometry(ww, wh, 0.03),
            new THREE.MeshStandardMaterial({ color: 0xb8d4e8, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.6 })
        );
        pane.position.set(wx, cabinH / 2 + 0.1, wz + (rotY ? 0 : 0.06));
        pane.rotation.y = rotY;
        cabinGroup.add(pane);
    }
    addWindow(-1.6, cabinD / 2 + 0.02, 1.1, 1.4);
    addWindow(1.6, cabinD / 2 + 0.02, 1.1, 1.4);
    addWindow(-cabinW / 2 - 0.02, 0, 1.0, 1.2, Math.PI / 2);
    addWindow(cabinW / 2 + 0.02, 0, 1.0, 1.2, Math.PI / 2);

    // Gabled roof
    const roofPitch = 0.42;
    const roofHalfD = cabinD / 2 + 0.5;
    const roofPanelL = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.6, 0.1, roofHalfD / Math.cos(roofPitch)), shingleMat);
    roofPanelL.position.set(0, cabinH + roofHalfD * Math.sin(roofPitch) / 2 + 0.15, -roofHalfD / 4);
    roofPanelL.rotation.x = -roofPitch;
    roofPanelL.castShadow = true;
    cabinGroup.add(roofPanelL);
    const roofPanelR = roofPanelL.clone();
    roofPanelR.position.z = roofHalfD / 4;
    roofPanelR.rotation.x = roofPitch;
    cabinGroup.add(roofPanelR);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.7, 0.14, 0.14), trimMat);
    ridge.position.set(0, cabinH + roofHalfD * Math.sin(roofPitch) + 0.18, 0);
    cabinGroup.add(ridge);

    // Porch overhang above door
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.2), shingleMat);
    porchRoof.position.set(0.85, cabinH + 0.05, cabinD / 2 + 0.55);
    porchRoof.rotation.x = -0.08;
    porchRoof.castShadow = true;
    cabinGroup.add(porchRoof);

    deck1Group.add(cabinGroup);

    // Bar Counter (inside cabin)
    const counterGeo = new THREE.BoxGeometry(2.2, 1.05, 0.65);
    const counter = new THREE.Mesh(counterGeo, woodDeckMaterial);
    counter.position.set(-1.5, 0.58, -1.1);
    counter.rotation.y = Math.PI / 6;
    counter.castShadow = true;
    counter.receiveShadow = true;
    deck1Group.add(counter);

    // Bar Espresso Machine
    const espressoMachineGroup = new THREE.Group();
    espressoMachineGroup.position.set(-1.5, 1.15, -1.1);
    espressoMachineGroup.rotation.y = Math.PI / 6;
    
    const machineBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), ironMaterial);
    espressoMachineGroup.add(machineBody);
    
    const brewHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2), ironMaterial);
    brewHead.position.set(0.12, -0.1, 0.2);
    brewHead.rotation.x = Math.PI / 2;
    espressoMachineGroup.add(brewHead);

    const coffeeCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.12), 
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    coffeeCup.position.set(0.12, -0.22, 0.2);
    espressoMachineGroup.add(coffeeCup);
    deck1Group.add(espressoMachineGroup);

    createCoffeeSteam(deck1Group, -1.38, 1.05, -1.02);

    // Lantern light
    const cabinLight = new THREE.PointLight(0xffb25c, 1.0, 10, 1.5);
    cabinLight.position.set(-1.0, 2.5, -1.0);
    cabinLight.castShadow = true;
    cabinLight.shadow.bias = -0.002;
    deck1Group.add(cabinLight);

    const interiorLantern = createLanternMesh();
    interiorLantern.position.set(-1.0, 3.2, -1.0);
    deck1Group.add(interiorLantern);

    // --- INTERACTIVE DOOR (front of cedar cabin) ---
    cabinDoorHinge = new THREE.Group();
    cabinDoorHinge.position.set(0.85, 0.14, 1.65);

    const doorWidth = 1.3;
    const doorHeight = 3.6;
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
    const doorMesh = new THREE.Mesh(doorGeo, woodDeckMaterial);
    doorMesh.position.set(-doorWidth / 2, doorHeight / 2, 0);
    doorMesh.castShadow = true;
    cabinDoorHinge.add(doorMesh);

    const doorGlassGeo = new THREE.BoxGeometry(0.6, 1.5, 0.12);
    const doorGlass = new THREE.Mesh(doorGlassGeo, glassMaterial);
    doorGlass.position.set(-doorWidth / 2, doorHeight / 2 + 0.3, 0);
    cabinDoorHinge.add(doorGlass);

    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
    const handle = new THREE.Mesh(handleGeo, brassMaterial);
    handle.position.set(-doorWidth + 0.15, doorHeight / 2 - 0.2, 0.1);
    handle.rotation.z = Math.PI / 2;
    cabinDoorHinge.add(handle);

    const handleKnobGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const handleKnob = new THREE.Mesh(handleKnobGeo, brassMaterial);
    handleKnob.position.set(-doorWidth + 0.15, doorHeight / 2 - 0.2, 0.05);
    cabinDoorHinge.add(handleKnob);
    window.cabinDoorHinge = cabinDoorHinge;

    doorMesh.userData = {
        isDoor: true,
        hinge: cabinDoorHinge,
        isOpen: false,
        name: "Cabin Wooden Door",
        details: "Click to open/close the glass paneled door to the interior cafe lounge.",
        originalMaterial: woodDeckMaterial,
        hoverMaterial: new THREE.MeshStandardMaterial({ color: 0xc2871b, roughness: 0.3, metalness: 0.2 })
    };
    interactiveTables.push(doorMesh);
    deck1Group.add(cabinDoorHinge);

    // --- CHALKBOARD MENU ---
    const menuBoardGroup = new THREE.Group();
    menuBoardGroup.position.set(2.2, 0.2, 1.2);
    menuBoardGroup.rotation.y = -Math.PI / 5;

    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0);
    const legL = new THREE.Mesh(legGeo, woodDeckMaterial);
    legL.position.set(-0.6, 1.0, 0);
    legL.rotation.z = 0.15;
    const legR = legL.clone();
    legR.position.x = 0.6;
    legR.rotation.z = -0.15;
    menuBoardGroup.add(legL, legR);

    const backLeg = new THREE.Mesh(legGeo, woodDeckMaterial);
    backLeg.position.set(0, 1.0, -0.4);
    backLeg.rotation.x = -0.3;
    menuBoardGroup.add(backLeg);

    const boardPanelGeo = new THREE.BoxGeometry(1.1, 1.3, 0.08);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x202b26, roughness: 0.95 });
    const boardPanel = new THREE.Mesh(boardPanelGeo, boardMat);
    boardPanel.position.set(0, 1.15, -0.05);
    boardPanel.rotation.x = 0.1;
    boardPanel.castShadow = true;
    menuBoardGroup.add(boardPanel);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.12), woodDeckMaterial);
    frameTop.position.set(0, 1.8, -0.05);
    frameTop.rotation.x = 0.1;
    menuBoardGroup.add(frameTop);

    const chalkMat = new THREE.MeshBasicMaterial({ color: 0xefedd9 });
    for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.6 - i*0.05, 0.03, 0.015), chalkMat);
        line.position.set(0, 1.6 - (i * 0.2), 0.01);
        line.rotation.x = 0.1;
        menuBoardGroup.add(line);
    }
    deck1Group.add(menuBoardGroup);

    createCafeDetails(deck1Group, woodDeckMaterial);
    createStringLights(deck1Group, 3.8, 3.6, 12);

    // --- REALISTIC PEOPLE ---
    const barista = createRealisticPerson({ skinColor: 0xc68642, shirtColor: 0xf5f0e8, apron: true, hairColor: 0x1a1008 });
    barista.position.set(-1.6, 0.14, -1.2);
    barista.rotation.y = Math.PI / 5;
    poseStandingBarista(barista);
    deck1Group.add(barista);

    treeGroup.add(deck1Group);

    // Patrons placed after tables are built (see end of buildTreehouse)

    // Upper deck
    const deck2Group = new THREE.Group();
    deck2Group.position.y = 16.0;

    deck2Group.add(createPlankDeck(6.5, 6.5, woodDeckMaterial, 0.4));

    // Railing posts
    const railingGroup = new THREE.Group();
    const postCount = 18;
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2);
    const railRadius = 3.9;
    
    for (let i = 0; i < postCount; i++) {
        const angle = (i / postCount) * Math.PI * 2;
        if (angle > 0.2 && angle < 0.8) continue; 
        
        const post = new THREE.Mesh(postGeo, ironMaterial);
        post.position.set(Math.cos(angle) * railRadius, 0.6, Math.sin(angle) * railRadius);
        post.castShadow = true;
        railingGroup.add(post);
    }
    deck2Group.add(railingGroup);

    // Handrail
    const handrailGeo = new THREE.TorusGeometry(3.9, 0.06, 8, 36, Math.PI * 1.8);
    const handrail = new THREE.Mesh(handrailGeo, woodDeckMaterial);
    handrail.rotation.x = Math.PI / 2;
    handrail.rotation.z = 0.8;
    handrail.position.y = 1.2;
    handrail.castShadow = true;
    deck2Group.add(handrail);

    // Lantern
    const deck2Lantern = createLanternMesh();
    deck2Lantern.position.set(0, 4.0, 3.0);
    const deck2Light = new THREE.PointLight(0xffb25c, 0.8, 8, 1.8);
    deck2Light.position.set(0, 3.2, 3.0);
    deck2Light.castShadow = true;
    deck2Group.add(deck2Lantern);
    deck2Group.add(deck2Light);
    createStringLights(deck2Group, 3.5, 2.2, 10);

    treeGroup.add(deck2Group);

    // Branches & Foliage
    const branchGeo = new THREE.CylinderGeometry(0.4, 0.7, 8, 8);
    branchGeo.translate(0, 4, 0);

    const branch1 = new THREE.Mesh(branchGeo, barkMaterial);
    branch1.position.set(-1.0, 5.0, 1.0);
    branch1.rotation.set(0.5, 0.2, -0.8);
    branch1.scale.set(0.8, 0.8, 0.8);
    treeGroup.add(branch1);

    const branch2 = new THREE.Mesh(branchGeo, barkMaterial);
    branch2.position.set(1.0, 12.0, -1.0);
    branch2.rotation.set(-0.6, 0.3, 0.9);
    branch2.scale.set(0.9, 0.9, 0.9);
    treeGroup.add(branch2);

    const branch3 = new THREE.Mesh(branchGeo, barkMaterial);
    branch3.position.set(0, 22.0, 0);
    branch3.rotation.set(0.3, 1.2, 0.6);
    treeGroup.add(branch3);

    const foliageLocations = [
        { x: -7, y: 9, z: 4, scale: 3.5 },
        { x: 7, y: 17, z: -5, scale: 3.8 },
        { x: -5, y: 22, z: -2, scale: 3.2 },
        { x: 4, y: 25, z: 3, scale: 4.5 },
        { x: -1, y: 27, z: -3, scale: 4.0 }
    ];

    foliageLocations.forEach(loc => {
        const leafCluster = new THREE.Group();
        leafCluster.position.set(loc.x, loc.y, loc.z);

        for(let j=0; j<4; j++) {
            const leafSph = new THREE.Mesh(
                new THREE.SphereGeometry(1.0, 10, 10),
                leafMaterial
            );
            leafSph.position.set(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            const size = 0.8 + Math.random() * 0.5;
            leafSph.scale.set(size, size * 0.8, size);
            leafSph.castShadow = true;
            leafSph.receiveShadow = true;
            leafCluster.add(leafSph);
        }
        leafCluster.scale.set(loc.scale, loc.scale, loc.scale);
        treeGroup.add(leafCluster);
    });

    // Booking tables
    // Table 1: Inside Cabin (Deck 1)
    createBookingTable(
        'table-1', 
        'Cedar Window Nook', 
        'Inside the cabin beside tall forest windows. Seats 2.',
        2, 
        deck1Group, 
        new THREE.Vector3(-1.4, 0.14, 0.4), 
        1.0
    );

    createBookingTable(
        'table-2', 
        'Open Deck Table', 
        'On the sunlit plank deck overlooking the valley. Seats 2.',
        2, 
        deck1Group, 
        new THREE.Vector3(3.0, 0.14, 2.6), 
        1.0
    );

    // Table 3: Upper Deck (Deck 2)
    createBookingTable(
        'table-3', 
        'Crow\'s Nest Peak', 
        'Our highest dining option on the top deck. Panoramic views. Seats 4.',
        4, 
        deck2Group, 
        new THREE.Vector3(-1.8, 0.2, -1.8), 
        1.3
    );

    // Table 4: Upper Deck Corner (Deck 2)
    createBookingTable(
        'table-4', 
        'Whispering Leaves Corner', 
        'A quiet corner under the shade of the highest leaves. Seats 2.',
        2, 
        deck2Group, 
        new THREE.Vector3(2.2, 0.2, -1.5), 
        1.1
    );

    // Patrons seated at real chair positions
    const patron1 = createRealisticPerson({ skinColor: 0xd4a574, shirtColor: 0x5c7a5a, pantsColor: 0x2a2a35, hairColor: 0x4a3020 });
    patron1.position.set(-0.6, 0.1, 1.35);
    patron1.rotation.y = Math.PI * 1.1;
    poseSeated(patron1, true);
    deck1Group.add(patron1);

    const patron2 = createRealisticPerson({ skinColor: 0x8d5524, shirtColor: 0xc2871b, pantsColor: 0x3d3d4a, hairColor: 0x0a0a0a });
    patron2.position.set(3.5, 0.1, 2.0);
    patron2.rotation.y = -Math.PI / 2.2;
    poseSeated(patron2, false);
    deck1Group.add(patron2);

    if (typeof initWaiter === 'function') initWaiter(deck1Group);

    createDaytimePollen();

    // Player foot shadow during walkthrough
    playerShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.35, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
    );
    playerShadow.rotation.x = -Math.PI / 2;
    playerShadow.visible = false;
    scene.add(playerShadow);
}

function createDenseForest(barkMaterial, leafMaterial) {
    const forestGroup = new THREE.Group();
    scene.add(forestGroup);
    const leafColors = [0x2a7a3e, 0x1f6b32, 0x3d8b4f, 0x246333, 0x4a9e5c];

    for (let i = 0; i < 38; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 42;
        const scale = 0.55 + Math.random() * 1.1;
        const tree = new THREE.Group();
        tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist - 8);
        tree.scale.setScalar(scale);

        const trunkH = 8 + Math.random() * 10;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2 + Math.random() * 0.2, 0.35 + Math.random() * 0.25, trunkH, 8),
            barkMaterial
        );
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        tree.add(trunk);

        const leafMat = leafMaterial.clone();
        leafMat.color.setHex(leafColors[i % leafColors.length]);
        const canopyCount = 2 + Math.floor(Math.random() * 4);
        for (let j = 0; j < canopyCount; j++) {
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.2 + Math.random() * 1.2, 8, 8),
                leafMat
            );
            leaves.position.set((Math.random() - 0.5) * 1.2, trunkH + j * 0.9, (Math.random() - 0.5) * 1.2);
            leaves.castShadow = true;
            tree.add(leaves);
        }
        forestGroup.add(tree);
    }
}

// Generate physical lantern mesh
function createLanternMesh() {
    const lanternGroup = new THREE.Group();
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.85 });
    
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.08, 8), capMat);
    lanternGroup.add(cap);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0xfff0c4, transparent: true, opacity: 0.6, roughness: 0.15, emissive: 0xffb25c, emissiveIntensity: 0.8 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8), glassMat);
    glass.position.y = -0.2;
    lanternGroup.add(glass);

    const bottomCap = cap.clone();
    bottomCap.position.y = -0.4;
    lanternGroup.add(bottomCap);

    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 16, Math.PI), capMat);
    wire.position.y = 0.08;
    wire.rotation.x = Math.PI / 2;
    lanternGroup.add(wire);

    lanternGroup.scale.set(1.5, 1.5, 1.5);
    return lanternGroup;
}

// Create steam rising
function createCoffeeSteam(parent, x, y, z) {
    const steamCount = 12;
    const steamGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(steamCount * 3);
    
    for (let i = 0; i < steamCount; i++) {
        positions[i*3] = x + (Math.random() - 0.5) * 0.1;
        positions[i*3+1] = y + Math.random() * 0.8;
        positions[i*3+2] = z + (Math.random() - 0.5) * 0.1;
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    const steamMat = new THREE.PointsMaterial({
        size: 0.12,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    steamParticles = new THREE.Points(steamGeo, steamMat);
    parent.add(steamParticles);
}

// Refined High-End Architectural Cedar Mannequin Creator
function createRefinedCedarMannequin(woodHex) {
    const mannequin = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
        color: woodHex,
        roughness: 0.5,
        metalness: 0.1
    });
    
    // Subgroup containing all jointed body pieces
    const bodyGroup = new THREE.Group();
    bodyGroup.name = "bodyGroup";
    
    // 1. Tapered Pelvis/Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.6, 12);
    const torso = new THREE.Mesh(torsoGeo, woodMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // 2. Chest (Slightly wider, rounded shoulder areas)
    const chestGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.45, 12);
    const chest = new THREE.Mesh(chestGeo, woodMat);
    chest.position.y = 1.3;
    chest.castShadow = true;
    bodyGroup.add(chest);

    // 3. Neck Joint
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15), woodMat);
    neck.position.y = 1.55;
    bodyGroup.add(neck);

    // 4. Head (Stylized egg/mannequin shape)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), woodMat);
    head.scale.set(1.0, 1.2, 1.0); // Egg shape
    head.position.y = 1.74;
    head.castShadow = true;
    bodyGroup.add(head);

    // 5. Left Arm Assembly (Jointed)
    const lShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), woodMat);
    lShoulderJoint.name = "leftShoulder";
    lShoulderJoint.position.set(-0.32, 1.4, 0);
    
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), woodMat);
    lUpperArm.position.y = -0.22;
    lShoulderJoint.add(lUpperArm);
    
    const lElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), woodMat);
    lElbowJoint.position.y = -0.42;
    lUpperArm.add(lElbowJoint);
    
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.32), woodMat);
    lForearm.position.y = -0.18;
    lElbowJoint.add(lForearm);
    bodyGroup.add(lShoulderJoint);

    // 6. Right Arm Assembly (Jointed)
    const rShoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), woodMat);
    rShoulderJoint.name = "rightShoulder";
    rShoulderJoint.position.set(0.32, 1.4, 0);
    
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), woodMat);
    rUpperArm.position.y = -0.22;
    rShoulderJoint.add(rUpperArm);
    
    const rElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), woodMat);
    rElbowJoint.position.y = -0.42;
    rUpperArm.add(rElbowJoint);
    
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.32), woodMat);
    rForearm.position.y = -0.18;
    rElbowJoint.add(rForearm);
    bodyGroup.add(rShoulderJoint);

    // 7. Left Leg Assembly
    const lHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), woodMat);
    lHipJoint.name = "leftHip";
    lHipJoint.position.set(-0.16, 0.5, 0);
    
    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.45), woodMat);
    lThigh.position.y = -0.26;
    lHipJoint.add(lThigh);
    
    const lKnee = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), woodMat);
    lKnee.name = "leftKnee";
    lKnee.position.y = -0.52;
    lThigh.add(lKnee);
    
    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.45), woodMat);
    lShin.position.y = -0.26;
    lKnee.add(lShin);
    bodyGroup.add(lHipJoint);

    // 8. Right Leg Assembly
    const rHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), woodMat);
    rHipJoint.name = "rightHip";
    rHipJoint.position.set(0.16, 0.5, 0);
    
    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.45), woodMat);
    rThigh.position.y = -0.26;
    rHipJoint.add(rThigh);
    
    const rKnee = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), woodMat);
    rKnee.name = "rightKnee";
    rKnee.position.y = -0.52;
    rThigh.add(rKnee);
    
    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.45), woodMat);
    rShin.position.y = -0.26;
    rKnee.add(rShin);
    bodyGroup.add(rHipJoint);

    mannequin.add(bodyGroup);
    mannequin.scale.set(1.2, 1.2, 1.2);
    
    return mannequin;
}

// Waterfall Splashing Water Spray Mist Particles
function createWaterfallMist(parent, x, y, z) {
    const mistCount = 50;
    const mistGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(mistCount * 3);
    const mistData = [];

    for (let i = 0; i < mistCount; i++) {
        // Position at the pool center with small offsets
        positions[i*3] = x + (Math.random() - 0.5) * 1.5;
        positions[i*3+1] = y + Math.random() * 0.8;
        positions[i*3+2] = z + (Math.random() - 0.5) * 1.5;

        mistData.push({
            speedY: 0.015 + Math.random() * 0.02,
            speedX: (Math.random() - 0.5) * 0.005,
            speedZ: (Math.random() - 0.5) * 0.005,
            maxHeight: 1.8 + Math.random() * 2.2
        });
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.4, 'rgba(230,248,255,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    const mistMat = new THREE.PointsMaterial({
        size: 0.45,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    waterfallSplashParticles = new THREE.Points(mistGeo, mistMat);
    waterfallSplashParticles.userData = { data: mistData, x: x, y: y, z: z };
    parent.add(waterfallSplashParticles);
}

function createDiningChair(woodMat, fabricMat, metalMat) {
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), fabricMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.05), fabricMat);
    back.position.set(0, 0.72, -0.18);
    back.castShadow = true;
    chair.add(back);
    [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.46, 6), woodMat);
        leg.position.set(x, 0.23, z);
        leg.castShadow = true;
        chair.add(leg);
    });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.03), woodMat);
    rail.position.set(0, 0.55, -0.18);
    chair.add(rail);
    return chair;
}

function createBookingTable(id, name, details, capacity, parentGroup, position, scaleFactor) {
    const tableGroup = new THREE.Group();
    tableGroup.position.copy(position);
    tableGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    tableGroup.name = id;

    const woodTex = createWoodTexture('#6b4a30');
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x7a5538, roughness: 0.55, metalness: 0.05 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f4, roughness: 0.95 });
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x2d4a35, roughness: 0.82 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.35 });

    // Round wooden table top
    const topMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.76, 0.07, 24), woodMat);
    topMesh.position.y = 0.76;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    tableGroup.add(topMesh);

    // Tablecloth
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.74, 0.02, 24), clothMat);
    cloth.position.y = 0.805;
    tableGroup.add(cloth);

    // Central pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.72, 12), woodMat);
    pedestal.position.y = 0.38;
    pedestal.castShadow = true;
    tableGroup.add(pedestal);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.04, 16), woodMat);
    base.position.y = 0.02;
    tableGroup.add(base);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xc2871b, metalness: 0.7, roughness: 0.35 });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Premium place settings per guest
    const settingsCount = Math.min(capacity, 4);
    for (let i = 0; i < settingsCount; i++) {
        const angle = (i / settingsCount) * Math.PI * 2;
        const px = Math.cos(angle) * 0.28;
        const pz = Math.sin(angle) * 0.28;
        const charger = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.008, 20), goldMat);
        charger.position.set(px, 0.818, pz);
        tableGroup.add(charger);
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.01, 20), plateMat);
        plate.position.set(px, 0.825, pz);
        tableGroup.add(plate);
        const napkin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.08), clothMat);
        napkin.position.set(px + 0.08, 0.83, pz);
        napkin.rotation.y = angle;
        tableGroup.add(napkin);
        const glass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.032, 0.038, 0.11, 12),
            new THREE.MeshStandardMaterial({ color: 0xe8f4fc, transparent: true, opacity: 0.4, roughness: 0.02, metalness: 0.5 })
        );
        glass.position.set(px - 0.12, 0.87, pz);
        tableGroup.add(glass);
    }

    // Centerpiece flower vase
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xf5f0e8 }));
    vase.position.set(0, 0.84, 0);
    tableGroup.add(vase);
    for (let f = 0; f < 4; f++) {
        const petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 8, 8),
            new THREE.MeshStandardMaterial({ color: f % 2 ? 0xe8a0bf : 0xffffff, roughness: 0.6 })
        );
        petal.position.set(Math.cos(f * 1.6) * 0.04, 0.92 + f * 0.02, Math.sin(f * 1.6) * 0.04);
        tableGroup.add(petal);
    }

    // Center lamp
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.1, 8), metalMat);
    lampBase.position.y = 0.84;
    tableGroup.add(lampBase);
    const shadeMat = new THREE.MeshStandardMaterial({
        color: 0x44dd66, emissive: 0x119933, emissiveIntensity: 1.2, roughness: 0.3
    });
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.14, 14), shadeMat);
    lampShade.position.y = 0.96;
    tableGroup.add(lampShade);
    const tableLight = new THREE.PointLight(0x44dd66, 0.9, 3, 2);
    tableLight.position.y = 0.95;
    tableGroup.add(tableLight);

    // Highlight ring (shown during scroll tour)
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.05, 32),
        new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    tableGroup.add(ring);

    // Floating label sign
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = 'rgba(11,35,20,0.85)';
    sctx.fillRect(0, 0, 256, 64);
    sctx.fillStyle = '#ffdd44';
    sctx.font = 'bold 22px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText(name.split(' ').slice(0, 2).join(' '), 128, 40);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.22),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true, depthWrite: false })
    );
    sign.position.set(0, 1.35, 0);
    sign.visible = false;
    tableGroup.add(sign);

    // Real dining chairs
    const chairAngles = capacity === 2
        ? [Math.PI * 0.55, Math.PI * 1.55]
        : [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    chairAngles.slice(0, capacity).forEach(angle => {
        const chair = createDiningChair(woodMat, fabricMat, metalMat);
        const dist = 0.95;
        chair.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        chair.rotation.y = -angle + Math.PI;
        tableGroup.add(chair);
    });

    parentGroup.add(tableGroup);

    window.tableRegistry[id] = { group: tableGroup, ring, lamp: lampShade, sign, light: tableLight };
    tableMeshForRaycasting(topMesh, id, name, details, capacity, lampShade, tableLight, woodMat, tableGroup);
}

function tableMeshForRaycasting(mesh, id, name, details, capacity, statusIndicator, lightSource, originalMaterial, tableGroup) {
    mesh.userData = {
        isTable: true, id, name, details, capacity, status: 'available',
        indicatorMesh: statusIndicator, lightSource, originalMaterial, tableGroup,
        hoverMaterial: new THREE.MeshStandardMaterial({ color: 0xc2871b, roughness: 0.35, metalness: 0.15 })
    };
    interactiveTables.push(mesh);
}

// Floating daytime pollen
function createDaytimePollen() {
    firefliesGroup = new THREE.Group();
    scene.add(firefliesGroup);

    const count = 35;
    const fireflyGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const fireflyData = [];

    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 2.0 + Math.random() * 8.5;
        const heightY = 1.0 + Math.random() * 26.0;

        positions[i*3] = Math.cos(theta) * radius;
        positions[i*3+1] = heightY;
        positions[i*3+2] = Math.sin(theta) * radius;

        fireflyData.push({
            speedX: 0.003 + Math.random() * 0.004,
            speedY: 0.004 + Math.random() * 0.008,
            speedZ: 0.003 + Math.random() * 0.004,
            phase: Math.random() * Math.PI * 2,
            amplitude: 0.3 + Math.random() * 0.4
        });
    }

    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.3, 'rgba(252, 248, 220, 0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    const fireflyMat = new THREE.PointsMaterial({
        size: 0.22,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(fireflyGeo, fireflyMat);
    firefliesGroup.add(points);
    firefliesGroup.userData = { data: fireflyData };
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // 1. Gentle tree sway
    if (treeGroup) {
        treeGroup.rotation.y = Math.sin(time * 0.15) * 0.02;
        treeGroup.rotation.z = Math.cos(time * 0.1) * 0.01;
    }

    // 2. Animate waterfall texture (flowing effect)
    if (waterfallTexture) {
        waterfallTexture.offset.y -= 0.015; // Vertical scroll down
    }

    // 3. Animate waterfall splash mist particles
    if (waterfallSplashParticles) {
        const positions = waterfallSplashParticles.geometry.attributes.position.array;
        const data = waterfallSplashParticles.userData.data;
        const u = waterfallSplashParticles.userData;

        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const idx = i * 3;
            
            // Rise upward, drift sideways
            positions[idx+1] += d.speedY;
            positions[idx] += d.speedX + Math.sin(time * 3 + i) * 0.005;
            positions[idx+2] += d.speedZ + Math.cos(time * 3 + i) * 0.005;

            // Reset when reaching max splash height
            if (positions[idx+1] > u.y + d.maxHeight) {
                positions[idx+1] = u.y;
                positions[idx] = u.x + (Math.random() - 0.5) * 1.5;
                positions[idx+2] = u.z + (Math.random() - 0.5) * 1.5;
            }
        }
        waterfallSplashParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Animate pollen drift
    if (firefliesGroup) {
        const positions = firefliesGroup.children[0].geometry.attributes.position.array;
        const data = firefliesGroup.userData.data;

        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const idx = i * 3;
            
            positions[idx] += Math.sin(time * 0.8 + d.phase) * d.speedX;
            positions[idx+1] += d.speedY * 0.6;
            positions[idx+2] += Math.cos(time * 0.8 + d.phase) * d.speedZ;

            const x = positions[idx];
            const z = positions[idx+2];
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 12.0) {
                positions[idx] = (x / dist) * 11.5;
                positions[idx+2] = (z / dist) * 11.5;
            }
            
            if (positions[idx+1] > 27.5) {
                positions[idx+1] = 1.0;
                positions[idx] = (Math.random() - 0.5) * 16.0;
                positions[idx+2] = (Math.random() - 0.5) * 16.0;
            }
        }
        firefliesGroup.children[0].geometry.attributes.position.needsUpdate = true;
    }

    // 5. Animate coffee cup steam rising
    if (steamParticles) {
        const positions = steamParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            const idx = i * 3;
            positions[idx+1] += 0.004;
            positions[idx] += Math.sin(time * 3 + i) * 0.001;
            
            if (positions[idx+1] > 2.2) {
                positions[idx+1] = 1.35;
                positions[idx] = -1.68 + (Math.random() - 0.5) * 0.05;
                positions[idx+2] = -1.68 + (Math.random() - 0.5) * 0.05;
            }
        }
        steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Twinkle string lights
    stringLightGroups.forEach((group, gi) => {
        group.children.forEach((child, i) => {
            if (child.isMesh && child.material.emissive) {
                child.material.emissiveIntensity = 1.2 + Math.sin(time * 2.5 + i * 0.8 + gi) * 0.4;
            }
        });
    });

    // Player shadow follows camera during walk
    if (playerShadow && window.scrollWalkActive && camera) {
        playerShadow.visible = camera.position.y < 14;
        if (playerShadow.visible) {
            playerShadow.position.set(camera.position.x, 7.48, camera.position.z);
        }
    }

    // 7. Update OrbitControls
    if (orbitControls && orbitControls.enabled) {
        orbitControls.update();
    }

    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

// Run setup immediately on window load
window.addEventListener('DOMContentLoaded', init3DScene);
