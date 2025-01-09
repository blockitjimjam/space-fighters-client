let balls = 0.001;
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js';
import { getDatabase, ref, set, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAHTyKCbiYNAjzDylwFXM4Otq_a3u0S6vg',
  authDomain: 'space-fighters-1448d.firebaseapp.com',
  databaseURL: "https://space-fighters-1448d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: 'space-fighters-1448d',
  storageBucket: 'space-fighters-1448d.firebasestorage.app',
  messagingSenderId: '976259904575',
  appId: '1:976259904575:web:ee4134d8c59678dcfb348a',
  measurementId: 'G-EHXHPP69MJ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Unique player ID
const playerId = `player_${Math.floor(Math.random() * 10000)}`;
document.addEventListener('DOMContentLoaded', () => {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Black background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.001, // Near clipping plane
    1000000 // Far clipping plane
  );
  camera.position.z = 5;
  const starCount = 100000; // Number of stars
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3); // x, y, z for each star
  const starSpheres = []; // Array to keep track of spheres near stars
  
  const maxRadius = 1000000000; // Maximum radius of the starfield
  const thresholdDistance = 30000; // Distance threshold for creating spheres
  
  for (let i = 0; i < starCount; i++) {
    const r = Math.random() * maxRadius; // Random radius within the sphere
    const theta = Math.random() * Math.PI * 2; // Random angle
    const phi = Math.acos(2 * Math.random() - 1); // Random angle for sphere distribution
  
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
  
    starPositions.set([x, y, z], i * 3); // Set star position in the array
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff, // White stars
    size: 10, // Star size
    sizeAttenuation: true, // Stars appear smaller with distance
  });
  
  // Create the starfield
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Function to check proximity to stars and render spheres
  function checkStars() {
    const positions = starGeometry.attributes.position.array;
  
    for (let i = 0; i < starCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
  
      const starPosition = new THREE.Vector3(x, y, z);
      const distance = camera.position.distanceTo(starPosition);
  
      // If the camera is within the threshold distance, create a sphere
      if (distance < thresholdDistance) {
        if (!starSpheres[i]) {
          const sphereGeometry = new THREE.SphereGeometry(Math.random() * 100, 16, 16); // Small spheres
          const sphereMaterial = new THREE.MeshStandardMaterial({
            emissive: new THREE.Color(0xffffff), // Glow effect
            emissiveIntensity: 1, // Constant glow
            color: 0xffffff,
          });
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere.position.set(x, y, z);
          scene.add(sphere);
          starSpheres[i] = sphere; // Store the sphere for future checks
        }
      } else {
        // If star is out of range and a sphere exists, remove it
        if (starSpheres[i]) {
          scene.remove(starSpheres[i]);
          starSpheres[i] = null;
        }
      }
    }
  }
  function teleportToRandomStar() {
    // Get all star positions from the geometry
    const positions = starGeometry.attributes.position.array;
  
    // Select a random star index
    const randomIndex = Math.floor(Math.random() * starCount);
  
    // Extract the x, y, z position of the selected star
    const x = positions[randomIndex * 3];
    const y = positions[randomIndex * 3 + 1];
    const z = positions[randomIndex * 3 + 2];
  
    // Teleport the camera to the star's position
    camera.position.set(x, y, z);
  }
  const otherPlayers = {};

    // Listen for updates to other players
    const playersRef = ref(db, "players");
    onChildAdded(playersRef, (snapshot) => {
      const otherPlayerId = snapshot.key;
      if (otherPlayerId !== playerId) {
        const otherPlayerData = snapshot.val();
        const otherPlayerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const otherPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const otherPlayerMesh = new THREE.Mesh(otherPlayerGeometry, otherPlayerMaterial);
        otherPlayerMesh.position.set(otherPlayerData.x, otherPlayerData.y, otherPlayerData.z);
        otherPlayers[otherPlayerId] = otherPlayerMesh;
        scene.add(otherPlayerMesh);
      }
    });

    onChildChanged(playersRef, (snapshot) => {
      const otherPlayerId = snapshot.key;
      if (otherPlayers[otherPlayerId]) {
        const otherPlayerData = snapshot.val();
        otherPlayers[otherPlayerId].position.set(otherPlayerData.x, otherPlayerData.y, otherPlayerData.z);
      }
    });

    onChildRemoved(playersRef, (snapshot) => {
      const otherPlayerId = snapshot.key;
      if (otherPlayers[otherPlayerId]) {
        scene.remove(otherPlayers[otherPlayerId]);
        delete otherPlayers[otherPlayerId];
      }
    });

    // Update player position in Firebase
    const playerRef = ref(db, `players/${playerId}`);
    function updatePlayerPosition() {
      set(playerRef, {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });
    }

  // Remove player from Firebase on disconnect
  onDisconnect(playerRef).remove();
  window.teleportToRandomStar = teleportToRandomStar;
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  let geometry = new THREE.SphereGeometry(9, 120, 120);
  let textureLoader = new THREE.TextureLoader();
  let texture = textureLoader.load('earth.jpg'); // Replace with your texture path
  let material = new THREE.MeshStandardMaterial({ map: texture });
  let earth = new THREE.Mesh(geometry, material);
  scene.add(earth);
  let mercurygeometry = new THREE.SphereGeometry(5, 120, 120);
  let mercurytexture = textureLoader.load('mercury.jpg'); // Replace with your texture path
  let mercurymaterial = new THREE.MeshStandardMaterial({ map: mercurytexture });
  let mercury = new THREE.Mesh(mercurygeometry, mercurymaterial);
  mercury.position.set(3500, 5, 5);
  scene.add(mercury);
  let atmosphereGeometry = new THREE.SphereGeometry(9.05, 120, 120); // Slightly larger than the Earth
  let atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // Light blue color
    transparent: true,
    opacity: 0.18, // Adjust opacity for a subtle effect
  });
  let atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);
  // Light setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
  scene.add(ambientLight);
  let sunGeometry = new THREE.SphereGeometry(300, 120, 120);

  let sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff18a,
  });
  let sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(5000, 5, 5);
  scene.add(sun);
  // Glow effect using ShaderMaterial
// Glow effect using ShaderMaterial
const glowGeometry = new THREE.SphereGeometry(320, 120, 120); // Slightly larger than sun
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    viewVector: { value: camera.position.clone() },
    c: { value: 0.001 }, // Intensity
    p: { value: 1.0 }, // Glow falloff
    glowColor: { value: new THREE.Color(0xfff18a) },
  },
  vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    varying float intensity;
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 vNormView = normalize(viewVector - (modelViewMatrix * vec4(position, 1.0)).xyz);
      intensity = pow(max(0.0, c - dot(vNormal, vNormView)), p);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying float intensity;
    void main() {
      gl_FragColor = vec4(glowColor, intensity);
    }
  `,
  side: THREE.BackSide, // Render glow from inside out
  blending: THREE.AdditiveBlending, // Additive for glow effect
  transparent: true, // Ensure transparency for gradient
});

// Add Glow Mesh
const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
glowMesh.position.set(5000, 5, 5);
glowMesh.renderOrder = 1; // Render after the sun sphere
scene.add(glowMesh);
// Add glow mesh

  const pointLight = new THREE.PointLight(0xfff18a, 4);
  pointLight.position.set(5000, 5, 5);
  scene.add(pointLight);

  // Movement controls
  const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };
  const rotation = { x: 0, y: 0 };

  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'w':
        movement.forward = true;
        break;
      case 's':
        movement.backward = true;
        break;
      case 'a':
        movement.left = true;
        break;
      case 'd':
        movement.right = true;
        break;
      case ' ':
        movement.up = true;
        break;
      case 'Shift':
        movement.down = true;
        break;
      case "p":
        window.speed = prompt("Enter new speed:", window.speed)
    }
  });

  document.addEventListener('keyup', (event) => {
    switch (event.key) {
      case 'w':
        movement.forward = false;
        break;
      case 's':
        movement.backward = false;
        break;
      case 'a':
        movement.left = false;
        break;
      case 'd':
        movement.right = false;
        break;
      case ' ':
        movement.up = false;
        break;
      case 'Shift':
        movement.down = false;
        break;
    }
  });

  // Pointer lock setup
  const canvas = renderer.domElement;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      console.log('Pointer locked');
    } else {
      console.log('Pointer unlocked');
    }
  });

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas) {
      rotation.x -= event.movementY * 0.002;
      rotation.y -= event.movementX * 0.002;
    }
  });
  window.speed = 4;
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    glowMaterial.uniforms.viewVector.value.copy(camera.position);

    // Rotate the sphere
    // sphere.rotation.x += 0.01;
    earth.rotation.y -= balls;

    // Camera movement
    
    if (movement.forward) {
      camera.position.z -= Math.cos(rotation.y) * window.speed;
      camera.position.x -= Math.sin(rotation.y) * window.speed;
    }
    if (movement.backward) {
      camera.position.z += Math.cos(rotation.y) * window.speed;
      camera.position.x += Math.sin(rotation.y) * window.speed;
    }
    if (movement.left) {
      camera.position.x -= Math.cos(rotation.y) * window.speed;
      camera.position.z += Math.sin(rotation.y) * window.speed;
    }
    if (movement.right) {
      camera.position.x += Math.cos(rotation.y) * window.speed;
      camera.position.z -= Math.sin(rotation.y) * window.speed;
    }
    if (movement.up) {
      camera.position.y += window.speed;
    }
    if (movement.down) {
      camera.position.y -= window.speed;
    }

    // Camera rotation
    camera.rotation.y = rotation.y;
    const time = Date.now() * 0.001;
    starMaterial.size = 10 + Math.sin(time) * 0.5;
    checkStars();
    updatePlayerPosition();
    renderer.render(scene, camera);
  }

  animate();

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    updatePlayerPosition();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
