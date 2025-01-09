let balls = 0.001;
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js';
import { getDatabase, ref, set, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { SolarSystem } from './solar-system.js';
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
  window.camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.001, // Near clipping plane
    1000000 // Far clipping plane
  );
  function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return function () {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }
  camera.position.z = 5;
  const starCount = 100000; // Number of stars
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3); // x, y, z for each star
  const starSpheres = []; // Array to keep track of spheres near stars
  
  const maxRadius = 1500000000; // Maximum radius of the starfield
  const thresholdDistance = 90000;
  
  const seed = 70773; // Your seed value (use the same value for consistent results)
  const random = seededRandom(seed); // Create a random function with the seed
  
  for (let i = 0; i < starCount; i++) {
    const r = random() * maxRadius; // Random radius within the sphere
    const theta = random() * Math.PI * 2; // Random angle
    const phi = Math.acos(2 * random() - 1); // Random angle for sphere distribution
  
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    starPositions.set([x, y, z], i * 3); // Set star position in the array
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff, // White stars
    size: 1, // Star size
    sizeAttenuation: false, // Stars appear smaller with distance
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
  let solarSystem = new SolarSystem(scene);
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
  let sunGeometry = new THREE.SphereGeometry(981, 120, 120);
  let textureLoader = new THREE.TextureLoader();
  let sunTexture = textureLoader.load('./assets/solar-system/sun.jpg');
  let sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: new THREE.Color(0xffffff), // Red emissive color
    emissiveIntensity: 2, // Emissive strength
    emissiveMap: sunTexture, // Optional: use the texture as an emissive map
  });
  let sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(5000, 5, 5);
  scene.add(sun);

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
