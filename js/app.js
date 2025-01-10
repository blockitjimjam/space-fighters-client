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
const loader = new THREE.OBJLoader();

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

  const maxRadius = 3000000000; // Maximum radius of the starfield
  const thresholdDistance = 120000;

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
  const players = loader.load("")
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
  const playerTexts = {};
  const playerTextContainer = document.createElement('div');
  playerTextContainer.style.position = 'absolute';
  playerTextContainer.style.top = '0';
  playerTextContainer.style.left = '0';
  document.body.appendChild(playerTextContainer);

  // Listen for updates to other players
  const playersRef = ref(db, "players");
  // Listen for new players added
  onChildAdded(playersRef, (snapshot) => {
    const otherPlayerId = snapshot.key;
    if (otherPlayerId !== playerId) {
      const otherPlayerData = snapshot.val();

      // Load the model for other players
      loader.load('../assets/models/placeholdership.obj', (object) => {
        const otherPlayerModel = new THREE.Group();
        otherPlayerModel.add(object);
        otherPlayerModel.scale.set(0.001, 0.001, 0.001);  // Scale to match size
        otherPlayerModel.position.set(otherPlayerData.x, otherPlayerData.y, otherPlayerData.z);
        scene.add(otherPlayerModel);
        otherPlayers[otherPlayerId] = otherPlayerModel;
        const playerText = document.createElement('div');
        playerText.className = 'player-text';
        playerText.textContent = "Player " + otherPlayerId;
        playerText.style.position = 'absolute';
        playerText.style.transform = 'translate(-50%, -100%)';
        playerTextContainer.appendChild(playerText);
        playerTexts[otherPlayerId] = playerText;
      });

    }
  });



  // Update other players' positions and rotations when Firebase data changes
  onChildChanged(playersRef, (snapshot) => {
    const otherPlayerId = snapshot.key;
    if (otherPlayers[otherPlayerId]) {
      const otherPlayerData = snapshot.val();
      const otherPlayerModel = otherPlayers[otherPlayerId];

      // Update position
      otherPlayerModel.position.set(otherPlayerData.x, otherPlayerData.y, otherPlayerData.z);

      // Update rotation
      otherPlayerModel.rotation.set(otherPlayerData.rx, otherPlayerData.ry, otherPlayerData.rz);
    }
  });

  // Handle player removal
  onChildRemoved(playersRef, (snapshot) => {
    const otherPlayerId = snapshot.key;
    if (otherPlayers[otherPlayerId]) {
      scene.remove(otherPlayers[otherPlayerId]);
      const playerLabel = playerTexts[otherPlayerId];
      if (playerLabel) {
        playerTextContainer.removeChild(playerLabel);
        delete playerTexts[otherPlayerId];
      }
      delete otherPlayers[otherPlayerId];
    }
  });


  // Update player position in Firebase
  const playerRef = ref(db, `players/${playerId}`);
  function updatePlayerPosition() {
    set(playerRef, {
      x: ship.position.x,
      y: ship.position.y,
      z: ship.position.z,
      rx: ship.rotation.x,
      ry: ship.rotation.y,
      rz: ship.rotation.z,
    });
  }
  function worldToScreen(worldPosition) {
    const vector = worldPosition.clone().project(camera);
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = - (vector.y * heightHalf) + heightHalf;

    return {
      x: vector.x,
      y: vector.y
    };
  }
  function isPlayerInView(playerPosition) {
    // Get the camera's frustum (viewable area)
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();
  
    // Update the frustum based on the camera's projection and view matrices
    camera.updateMatrixWorld(); // Make sure the camera's world matrix is updated
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
  
    // Check if the player's position is within the frustum
    return frustum.containsPoint(playerPosition);
  }
  
  // Update player text position with visibility check
  function updatePlayerTextPosition() {
    Object.keys(otherPlayers).forEach((playerId) => {
      const playerModel = otherPlayers[playerId];
      const playerText = playerTexts[playerId];
  
      if (playerModel && playerText) {
        const playerPosition = playerModel.position.clone();
        const screenPosition = worldToScreen(playerPosition);
  
        // Check if the player is in view
        const inView = isPlayerInView(playerPosition);
  
        // If the player is in view, update the position of the text
        if (inView) {
          playerText.style.left = `${screenPosition.x}px`;
          playerText.style.top = `${screenPosition.y - 10}px`;
          playerText.style.display = 'block'; // Show the label
        } else {
          playerText.style.display = 'none'; // Hide the label if the player is out of view
        }
      }
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

  const pointLight = new THREE.PointLight(0xfff18a, 2, 200000);
  pointLight.position.set(5000, 5, 5);
  scene.add(pointLight);

  let ship;
  loader.load('../assets/models/placeholdership.obj', (object) => {
    ship = object;
    ship.position.set(15, 0, 0); // Initial position
    ship.rotation.x = 1.512;
    ship.scale.set(0.001, 0.001, 0.001);
    scene.add(ship);
  });

  // Movement and rotation controls
  const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };
  const rotation = { x: 0, y: 0, z: 0 }; // Rotation angles
  const rotationTarget = { x: 0, y: 0, z: 0 }; // Target rotation for interpolation
  let warpActive = false;
  let fovTarget = 75; // Default FOV
  const maxFov = 179.6; // FOV during warp
  const fovSpeed = 0.1; // How quickly FOV changes
  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Add a bloom effect for the warp glow
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  // Warp Shader (for radial blur)
  const warpShader = {
    uniforms: {
      tDiffuse: { value: null },
      strength: { value: 0.0 }, // Strength of the warp blur
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    varying vec2 vUv;
    void main() {
      vec2 coord = vUv - 0.5;
      float dist = length(coord);
      coord += coord * strength * dist;
      gl_FragColor = texture2D(tDiffuse, coord + 0.5);
    }
  `,
  };
  const warpPass = new THREE.ShaderPass(warpShader);
  composer.addPass(warpPass);
  // Blue filter shader
  const blueFilterShader = {
    uniforms: {
      tDiffuse: { value: null },
      blueIntensity: { value: 0.3 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float blueIntensity;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        // Apply blue filter by modifying the color channels
        color.r *= 1.0 - blueIntensity;
        color.g *= 1.0 - blueIntensity;
        color.b += blueIntensity;
        gl_FragColor = color;
      }
    `,
  };

  const blueFilterPass = new THREE.ShaderPass(blueFilterShader);
  composer.addPass(blueFilterPass);
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
      case 'p':
        window.speed = prompt("Enter new speed:", window.speed);
        break;
    }
    if (event.key === "f" && !warpActive) {
      // Press 'w' to trigger warp
      warpActive = true;
      fovTarget = maxFov;
      warpPass.uniforms.strength.value = 7; // Activate blur
      toggleWarpEffect();
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
    if (event.key === "f" && warpActive) {
      // Release 'w' to deactivate warp
      warpActive = false;
      fovTarget = 75;
      warpPass.uniforms.strength.value = 0.0; // Deactivate blur
      toggleWarpEffect();
    }
  });
  function toggleWarpEffect() {
    if (warpActive) {
      blueFilterPass.enabled = true; // Enable blue filter when warp is active
    } else {
      blueFilterPass.enabled = false; // Disable blue filter when warp is not active
    }
  }
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
      rotationTarget.x = THREE.MathUtils.clamp(rotationTarget.x, -Math.PI / 2, Math.PI / 2); // Limit pitch
      camera.rotation.x -= event.movementX * 0.002;
    }
  });

  window.speed = 0.003; // Default speed
  const cameraOffset = new THREE.Vector3(0, 0.05, 0.2); // Offset from the player

  function interpolate(current, target, factor) {
    return current + (target - current) * factor;
  }

  // Target rotations for smooth interpolation

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (warpActive) {
      speed = 100000;
    } else {
      speed = 0.003;
    }
    if (ship) {
      // Update ship position with interpolation
      
      if (movement.forward) {
        ship.position.z -= Math.cos(ship.rotation.y) * window.speed;
        ship.position.x -= Math.sin(ship.rotation.y) * window.speed;
      }
      if (movement.backward) {
        ship.position.z += Math.cos(ship.rotation.y) * window.speed;
        ship.position.x += Math.sin(ship.rotation.y) * window.speed;
      }
      if (movement.left) {
        rotationTarget.z = 0.5; // Target a banking rotation to the left
        rotationTarget.y += 0.02; // Slight yaw to the left
      } else if (movement.right) {
        rotationTarget.z = -0.5; // Target a banking rotation to the right
        rotationTarget.y -= 0.02; // Slight yaw to the right
      } else {
        rotationTarget.z = 0; // Reset banking if no left/right movement
      }
      if (movement.up) {
        rotationTarget.x = Math.max(rotationTarget.x - 0.02, -0.5); // Pitch up (limit to avoid excessive rotation)
        ship.position.y += window.speed;
      } else if (movement.down) {
        rotationTarget.x = Math.min(rotationTarget.x + 0.02, 0.5); // Pitch down (limit to avoid excessive rotation)
        ship.position.y -= window.speed;
      } else {
        rotationTarget.x = 0; // Reset pitch if no up/down movement
      }

      // Smoothly interpolate ship rotation
      ship.rotation.x = interpolate(ship.rotation.x, rotationTarget.x, 0.1); // Pitch
      ship.rotation.y = interpolate(ship.rotation.y, rotationTarget.y, 0.1); // Yaw
      ship.rotation.z = interpolate(ship.rotation.z, rotationTarget.z, 0.1); // Bank (Roll)

      // Update camera position to follow the ship
      const offsetPosition = new THREE.Vector3().copy(cameraOffset).applyQuaternion(ship.quaternion);
      camera.position.copy(ship.position).add(offsetPosition);

      // Lock the camera's rotation to look at the ship
      camera.lookAt(ship.position);

      // Preserve updatePlayerPosition() call
      updatePlayerPosition();
      updatePlayerTextPosition();
    }

    // Call other necessary updates
    checkStars();
    camera.fov += (fovTarget - camera.fov) * fovSpeed;
    camera.updateProjectionMatrix();
    composer.render();

    // Render the scene
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
