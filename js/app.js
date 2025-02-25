let balls = 0.001;
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js';
import { getDatabase, ref, set, get, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, remove } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
import { SolarSystem } from './solar-system.js';
import { Marker, MarkerType } from './marker.js';
import { Laser, MultiplayerLaser } from './laser.js';
import { Star, StarType } from './star.js';
import { Planet } from './planet.js';
import { StarSystem } from './starsystem.js';
import { Nebula } from './nebula.js';
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
const auth = getAuth(app);
window.auth = auth;
const db = getDatabase(app);
const firestoreDB = getFirestore(app);
const loader = new THREE.OBJLoader();
document.querySelector(".game-ui-container").style.display = "none";
function init(username) {
  document.querySelector(".game-ui-container").style.display = "block";
  document.querySelector("#warp").addEventListener("click", () => {
    let menu = document.getElementById("warp-menu");
    console.log("yo")
    if (menu.style.display == "none") {
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  });
  document.querySelector("#chat").addEventListener("click", () => {
    let menu = document.getElementById("chat-menu");
    console.log("yo")
    if (menu.style.display == "none") {
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  });
  
  const playerId = username;
  let health = 200;
  let shield = 100;
  // Scene setup
  const scene = new THREE.Scene();
  const clock = new THREE.Clock();
  scene.background = new THREE.Color(0x000000); // Black background

  // Camera setup
  window.camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.0001, // Near clipping plane
    10000000000 // Far clipping plane
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
  const starCount = 110000; // Number of stars
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3); // x, y, z for each star
  const starSpheres = []; // Array to keep track of spheres near stars
  let textureLoader = new THREE.TextureLoader();
  const maxRadius = 5000000000; // Maximum radius of the starfield
  const thresholdDistance = 400000;
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
  const warpSpeeds = {
    One: 5000,
    Two: 50000,
    Three: 100000,
    Four: 2000000
  }
  const impulseSpeeds = {
    Slow: 0.003,
    Medium: 0.09,
    Sscruise: 1
  }

  const renderer = new THREE.WebGLRenderer();
  const transitionSpeed = 0.01;
  const fovSpeed = 0.01; // How quickly FOV changes
  const composer = new THREE.EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  const renderPass = new THREE.RenderPass(scene, camera);
  let warpMode = warpSpeeds.One;
  let impulseMode = impulseSpeeds.Slow;
  document.getElementById("impulse-speed").addEventListener("change", () => {
    switch (document.getElementById("impulse-speed").value) {
      case "slow":
        impulseMode = impulseSpeeds.Slow;
        break;
      case "medium":
        impulseMode = impulseSpeeds.Medium;
        break;
      case "sscruise":
        impulseMode = impulseSpeeds.Sscruise;
        break;
    }
  });
  document.getElementById("warp-speed").addEventListener("change", () => {
    switch (document.getElementById("warp-speed").value) {
      case "warp1":
        warpMode = warpSpeeds.One;
        break;
      case "warp2":
        warpMode = warpSpeeds.Two;
        break;
      case "warp3":
        warpMode = warpSpeeds.Three;
        break;
      case "warp4":
        warpMode = warpSpeeds.Four;
        break;
    }
  });

  const seed = 90732; // Your seed value (use the same value for consistent results)
  const random = seededRandom(seed); // Create a random function with the seed

  for (let i = 0; i < starCount; i++) {
    const r = (random() * maxRadius) + 400000;
    const theta = random() * Math.PI * 2; // Random angle
    const phi = Math.acos(2 * random() - 1); // Random angle for sphere distribution

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    starPositions.set([x, y, z], i * 3); // Set star position in the array
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starTexture = textureLoader.load('./assets/stars/startexture.svg');
  const starMaterial = new THREE.PointsMaterial({
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

      if (distance < thresholdDistance) {
        if (!starSpheres[i]) {
          const starSystem = new StarSystem(x, y, z, scene, playerTextContainer, ship);
          markers.push(starSystem.marker);
          starSystem.planets.forEach((element) => {
            markers.push(element.marker);
            console.log(markers);
          });
          starSpheres[i] = starSystem;
        }
      } else {
        if (starSpheres[i]) {
          starSpheres[i].remove();
          starSpheres[i] = null;
        }
      }
    }
  }
  // const nebulaPosition = new THREE.Vector3(10000000, 0, -5000);
  // const nebula = new Nebula(scene, nebulaPosition, 1000000, 72, 500000);
  function generatePlanetTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
  
    const noise2D = createNoise2D(); // Create a Simplex noise instance using SkyPack
    const imageData = ctx.createImageData(size, size);
  
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size - 0.5;
        const ny = y / size - 0.5;
  
        // Generate noise value
        const elevation = noise2D(nx * 5, ny * 5); // Scale coordinates for detail
        const colorValue = Math.floor((elevation + 1) * 128); // Normalize to 0-255
  
        // Apply a color map (e.g., ocean vs land)
        const [r, g, b] = elevation > 0 ? [colorValue, 180, 80] : [0, 80, 200];
  
        // Set pixel color
        const index = (y * size + x) * 4;
        imageData.data[index] = r;     // Red
        imageData.data[index + 1] = g; // Green
        imageData.data[index + 2] = b; // Blue
        imageData.data[index + 3] = 255; // Alpha
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  window.scene = scene;
  function createPlanet(scene) {
    const planet = new Planet(ship.position.x, ship.position.y, ship.position.z, scene);
  }
  window.createPlanet = createPlanet;

  let pendingDamage = false;
  function teleportToRandomStar() {
    // Get all star positions from the geometry
    const positions = starGeometry.attributes.position.array;

    // Select a random star index
    const randomIndex = Math.floor(Math.random() * starCount);

    // Extract the x, y, z position of the selected star
    const x = positions[randomIndex * 3];
    const y = positions[randomIndex * 3 + 1];
    const z = positions[randomIndex * 3 + 2];

    ship.position.set(x, y, z);
  }
  function processDamage() {
    if (!pendingDamage) {
      const hitRef = ref(db, `hit/${playerId}`);
      pendingDamage = true;  // Lock the damage processing

      get(hitRef).then((snapshot) => {
        const hitData = snapshot.val();

        if (hitData && hitData.damage) {
          const damage = hitData.damage;
          if (shield > 0) {
            shield = Math.max(shield - damage, 0);
            console.log(`Player ${playerId}'s shield reduced to ${shield}`);
          } else {
            health = Math.max(health - damage, 0);
            console.log(`Player ${playerId}'s health reduced to ${health}`);
          }


          remove(hitRef).catch((error) => {
            console.error("Error removing damage from Firebase: ", error);
          });
        }
      }).catch((error) => {
        console.error("Error fetching damage data from Firebase: ", error);
      }).finally(() => {
        pendingDamage = false;
      });
    }
  }

  const otherPlayers = {};
  const playerTexts = {};
  const myLasers = [];
  const multiplayerLasers = [];
  const playerTextContainer = document.createElement('div');
  playerTextContainer.style.position = 'absolute';
  playerTextContainer.style.top = '0';
  playerTextContainer.style.left = '0';
  playerTextContainer.id = 'markerContainer';
  document.body.appendChild(playerTextContainer);

  // Listen for updates to other players
  const playersRef = ref(db, "players");
  const lasersRef = ref(db, "lasers");
  const chatRef = ref(db, "chat");
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
        playerText.className = 'player-text player-text-border';
        playerText.innerHTML = `<div class='player-label'>Player</div>${otherPlayerId}<div id='au-counter'></div>`;
        playerText.style.position = 'absolute';
        playerText.style.transform = 'translate(-50%, -100%)';
        playerTextContainer.appendChild(playerText);
        playerTexts[otherPlayerId] = playerText;
      });

    }
  });
  onChildAdded(lasersRef, (snapshot) => {
    const laserData = snapshot.val();
    const laserId = snapshot.key;
    if (laserData.player !== playerId) {
      multiplayerLasers.push(new MultiplayerLaser(scene, laserData.position, laserData.rotation, 1.5, 3, laserId));
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
  
  // Listen for new messages added to the chat
  onChildAdded(chatRef, (snapshot) => {
    const chatBox = document.getElementById("chat-box");
    const message = snapshot.val();
    const newTextElement = document.createElement("p");
  
    // Display the message along with the username (snapshot.key) and the message content
    newTextElement.innerHTML = `<div style="color: red; display: inline-block;">${message.username}: </div> ${message.message}`;;
    chatBox.appendChild(newTextElement);
  });
  
  // Listen for changes in the 'latestmessage' property using onChildChanged
  onChildChanged(chatRef, (snapshot) => {
    const latestMessage = snapshot.val();
    if (snapshot.key === "latestmessage" && latestMessage) {
      const chatBox = document.getElementById("chat-box");
      const newTextElement = document.createElement("p");
  
      // Display the latest message with the username
      newTextElement.innerHTML = `<div style="color: red; display: inline-block;">${latestMessage.username}: </div> ${latestMessage.message}`;
      chatBox.appendChild(newTextElement);
    }
  });
  
  // Handle sending a new message
  document.getElementById("chat-send").addEventListener('click', () => {
    const chatInput = document.getElementById("chat-input");
    const messageText = chatInput.value;
  
    if (messageText.trim() !== "") {
      const message = {
        username: playerId,  // Use the playerId as the username
        message: messageText
      };
      let lchatRef = ref(db, "chat/latestmessage")
      // Set the latestmessage property in the Firebase database
      set(lchatRef, message);
  
      // Clear the input field
      chatInput.value = "";
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
  function addLaser(position, rotation, id) {
    const newLaserRef = ref(db, `lasers/${id}`);
    set(newLaserRef, {
      player: playerId,
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z]
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
    // Get the camera's position and direction
    const cameraPosition = camera.position;
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection); // Get the forward direction of the camera

    // Vector from the camera to the player
    const toPlayer = new THREE.Vector3()
      .subVectors(playerPosition, cameraPosition)
      .normalize();

    // Angle between camera direction and direction to player
    const angleToPlayer = cameraDirection.angleTo(toPlayer);

    // Horizontal and vertical FoV (in radians)
    const horizontalFoV = THREE.MathUtils.degToRad(camera.fov);
    const verticalFoV = horizontalFoV / camera.aspect;

    // Check if the player is within the camera's angular field of view
    const isInViewAngle = angleToPlayer < horizontalFoV / 1.2;

    // Final visibility check
    return isInViewAngle;
  }
  window.isPlayerInView = isPlayerInView;
  window.worldToScreen = worldToScreen;


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
        const distance = playerPosition.distanceTo(ship.position);
        const distanceInAU = distance / 5000;

        // If the player is in view, update the position of the text
        if (inView && distanceInAU < 10000) {
          playerText.style.left = `${screenPosition.x}px`;
          playerText.style.top = `${screenPosition.y - 10}px`;
          playerText.style.display = 'block'; // Show the label
          playerText.querySelector("#au-counter").textContent = `${distanceInAU.toFixed(5)} AU`;
        } else {
          playerText.style.display = 'none';
        }
      }
    });
  }
  // Remove player from Firebase on disconnect
  onDisconnect(playerRef).remove();
  window.teleportToRandomStar = teleportToRandomStar;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  let solarSystem = new SolarSystem(scene);
  let atmosphereGeometry = new THREE.SphereGeometry(9.05, 120, 120); // Slightly larger than the Earth
  let atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // Light blue color
    transparent: true,
    depthWrite: false,
    opacity: 0.18, // Adjust opacity for a subtle effect
  });
  let atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);
  let nebula = new Nebula(scene, new THREE.Vector3(3115000000, 0, 1000000000), 200000000, 31, 500000);
  // Light setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
  scene.add(ambientLight);
  let sunGeometry = new THREE.SphereGeometry(981, 120, 120);
  let sunTexture = textureLoader.load('./assets/solar-system/sun.jpg');
  let sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: new THREE.Color(0xffffff), // Red emissive color
    emissiveIntensity: 15, // Emissive strength
    emissiveMap: sunTexture, // Optional: use the texture as an emissive map
  });
  let sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(5000, 5, 5);
  scene.add(sun);

  const pointLight = new THREE.PointLight(0xfff18a, 2, 200000);
  pointLight.position.set(5000, 5, 5);
  scene.add(pointLight);

  window.ship = false;
  loader.load('../assets/models/placeholdership.obj', (object) => {
    window.ship = object; // Make it globally accessible if necessary

    // Set transformations
    ship.position.set(15, 0, 0); // Initial position
    ship.scale.set(0.001, 0.001, 0.001); // Scale the model

    // Add the ship to the scene
    scene.add(ship);

    // Add a marker (assuming Marker is properly defined elsewhere)
    markers.push(
        new Marker(
            MarkerType.Planet,
            "Earth",
            playerTextContainer,
            solarSystem.planets["earth"],
            ship,
            1000000
        )
    );
});


  // Movement and rotation controls


  // Add a bloom effect for the warp glow
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2,
    1,
    0.95
  );

  // Warp Shader (for radial blur)
  const warpShader = {
    uniforms: {
      tDiffuse: { value: null },
      strength: { value: 0.5 }, // Strength of the warp blur
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
  let markers = [];
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
  composer.addPass(renderPass);
composer.addPass(bloomPass);

  let fireZoom = false;
  document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
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
      case 'r':
        if (!isMouseDown) {
          isMouseDown = true;
          cameraRotation = { x: 0, y: 0 };
          document.getElementById("aim-cursor").style.display = "block";
        }
        break;
      case ' ':
        movement.up = true;
        break;
      case 'shift':
        movement.down = true;
        break;
      case 'z':
        fireZoom = true;
        break;
    }
    if (event.key.toLowerCase() === "f" && !warpActive) {
      // Press 'w' to trigger warp
      warpActive = true;
      fovTarget = maxFov;
      composer.render();
      blueFilterPass.renderToScreen = true;
      warpPass.uniforms.strength.value = 7; // Activate blur
      toggleWarpEffect();
    }
  });

  document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
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
      case 'r':
        isMouseDown = false;
        document.getElementById("aim-cursor").style.display = "none";
      case ' ':
        movement.up = false;
        break;
      case 'shift':
        movement.down = false;
        break;
      case 'z':
        fireZoom = false;
        break;
    }
    if (event.key.toLowerCase() === "f" && warpActive) {
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
  let isMouseDown = false;
  let cameraRotation = { x: 0, y: 0 };
  document.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
      isMouseDown = true;
      cameraRotation = { x: 0, y: 0 };
      document.getElementById("aim-cursor").style.display = "block";
    } else if (event.button === 0) {
      if (isMouseDown) {
        const laserQuaternion = camera.quaternion.clone();
        const id = Math.floor(Math.random() * 100000000);
        myLasers.push(new Laser(
          scene,
          camera.position.clone().add(new THREE.Vector3(0, -0.001, 0)),
          laserQuaternion,
          1.5,
          3,
          id,
          otherPlayers,
          db
        ));
        addLaser(camera.position, camera.rotation, id);
      }
    }
    console.log('Mouse button pressed down!');
  });

  document.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
      isMouseDown = false;
      document.getElementById("aim-cursor").style.display = "none";
    }
    console.log('Mouse button released!');
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
      if (isMouseDown) {
        // Adjust camera rotation based on mouse movement
        cameraRotation.x -= event.movementY * 0.005;
        cameraRotation.y -= event.movementX * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
      }
    }
  });

  window.speed = 0.003; // Default speed
  const cameraOffset = new THREE.Vector3(0, 0.007, 0.04); // Offset from the player

  function interpolate(current, target, factor, threshold = 0.01) {
    const interpolated = current + (target - current) * factor;
    if (Math.abs(target - current) > threshold) {
      updatePlayerPosition();
    }
    return interpolated;
  }


  let lastUpdateTime = 0;
  const updateInterval = 100; // milliseconds

  function updatePlayerPositionThrottled() {
    const now = performance.now();
    if (now - lastUpdateTime > updateInterval) {
      lastUpdateTime = now;
      updatePlayerPosition(); // Send data to Firebase
      console.log("data sent");
    }
  }
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    let warpMovement = false;
    solarSystem.update();
    fovTarget = 75;
    if (warpActive) {
      fovTarget = maxFov;
      warpMovement = true;
      const targetSpeed = warpMode || 1;
      const progress = Math.min(speed / targetSpeed, 1);

      // Using a sinusoidal ease-in/out to smooth the transition
      const smoothFactor = Math.sin(progress * Math.PI / 2); // Sinusoidal ease-in
      const transitionSpeed = (targetSpeed - speed) * smoothFactor;

      // Multiply the transition speed to make more granular speed changes
      const speedChange = transitionSpeed * 0.05; // Lower this value to make the transition slower (more steps)

      speed += speedChange;
      speed = Math.min(speed, targetSpeed);


    } else {
      if (speed > (impulseMode + 0.01)) {
        warpMovement = true;
        const targetMinSpeed = impulseMode;
        const progress = Math.min((speed - impulseMode) / (speed - targetMinSpeed), 1);
        const smoothFactor = Math.sin(progress * Math.PI / 2);
        const transitionSpeed = (targetMinSpeed - speed) * smoothFactor;
        const speedChange = transitionSpeed * 0.03;
        speed += speedChange;
        speed = Math.max(speed, targetMinSpeed);

      } else {
        speed = impulseMode;
      }
    }


    if (ship) {
      // Update ship position with interpolation

      if (movement.forward || warpMovement == true) {
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

      if (!isMouseDown) {
        const offsetPosition = new THREE.Vector3().copy(cameraOffset).applyQuaternion(ship.quaternion);
        camera.position.copy(ship.position).add(offsetPosition);
        camera.lookAt(ship.position);
        camera.fov += (fovTarget - camera.fov) * fovSpeed;
      } else {
        let cannonOffset = new THREE.Vector3(0, 0.01, 0);
        const offsetPosition = new THREE.Vector3().copy(cannonOffset).applyQuaternion(ship.quaternion);
        camera.position.copy(ship.position).add(offsetPosition);
        const direction = new THREE.Vector3(
          Math.cos(cameraRotation.x) * Math.sin(cameraRotation.y),
          Math.sin(cameraRotation.x),
          Math.cos(cameraRotation.x) * Math.cos(cameraRotation.y)
        );

        // Update camera's look direction
        const lookAtPosition = new THREE.Vector3().copy(ship.position).add(direction);
        camera.lookAt(lookAtPosition);
        if (fireZoom) {
          fovTarget = 3;
        } else {
          fovTarget = 75;
        }
        camera.fov += (fovTarget - camera.fov) * 0.5;
      }

      // Lock the camera's rotation to look at the ship
      if (Object.values(movement).some(value => value)) {
        updatePlayerPositionThrottled();
      }
      const deltaTime = clock.getDelta();
      markers.forEach((element) => { element.update() });
      for (let i = myLasers.length - 1; i >= 0; i--) {
        const isActive = myLasers[i].update(deltaTime);
        if (!isActive) {
          const removeLaserRef = ref(db, `lasers/${myLasers[i].id}`);
          get(removeLaserRef).then((snapshot) => {
            const laserData = snapshot.val();
            if (laserData && laserData.player == playerId) {
              remove(removeLaserRef).then(() => {
                console.log(`Laser with ID ${myLasers[i].id} removed from Firebase`);
              }).catch((error) => {
                console.error("Error removing laser from Firebase: ", error);
              });
            }
          }).catch((error) => {
            console.error("Error fetching laser data from Firebase: ", error);
          });

          myLasers.splice(i, 1);
        }
      }
      for (let i = multiplayerLasers.length - 1; i >= 0; i--) {
        const isActive = multiplayerLasers[i].update(deltaTime);
        if (!isActive) {
          const removeLaserRef = ref(db, `lasers/${multiplayerLasers[i].id}`);
          get(removeLaserRef).then((snapshot) => {
            const laserData = snapshot.val();
            if (laserData && laserData.player == playerId) {
              removeLaserRef.remove().then(() => {
                console.log(`Laser with ID ${multiplayerLasers[i].id} removed from Firebase`);
              }).catch((error) => {
                console.error("Error removing laser from Firebase: ", error);
              });
            }
          }).catch((error) => {
            console.error("Error fetching laser data from Firebase: ", error);
          });
          multiplayerLasers.splice(i, 1);
        }
      }

    }
    processDamage();
    document.getElementById("health-bar").style.width = (health / 200) * 100 + "%";
    document.getElementById("shield-bar").style.width = shield + "%";
    if (health == 0) {
      ship.position.x = 15;
      ship.position.y = 0;
      ship.position.z = 0;
      health = 200;
      shield = 100;
      updatePlayerPosition();
    }
    updatePlayerTextPosition();

    // Call other necessary updates
    checkStars();
    camera.updateProjectionMatrix();
    composer.render();
  }
  setInterval(() => {
    if (shield < 1 && health != 200) {
      health++;
    } else {
      if (shield < 100) {
        shield++;
      }
    }
  }, 1500);

  animate();




  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    updatePlayerPosition();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
async function getUsername(uid) {
  try {
    const userDoc = doc(firestoreDB, 'users', uid);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      return userSnapshot.data().username;
    } else {
      throw new Error('User does not exist');
    }
  } catch (error) {
    console.error('Error fetching username:', error.message);
    return null;
  }
}
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(firestoreDB, 'users', user.uid), { username, email });
    document.getElementById("container").style.display = "none";
    init(await getUsername(user.uid));
    console.log("I came from signup form")
  } catch (error) {
    console.error(error.message);
    alert('Error signing up: ' + error.message);
  }
});


// Login with email
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    document.getElementById("container").style.display = "none";
    init(await getUsername(user.uid));
    console.log("I came from login form")
  } catch (error) {
    console.error(error.message);
    alert('Error logging in: ' + error.message);
  }
});

// Signup/Login with Google
document.getElementById('google-signup').addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;


    const userRef = doc(firestoreDB, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      const username = prompt('Choose a username:');
      await setDoc(userRef, { username, email: user.email });
    }

    document.getElementById("container").style.display = "none";
    init(await getUsername(user.uid));
    console.log("I came from google signup")
  } catch (error) {
    console.error(error.message);
    alert('Error signing up with Google: ' + error.message);
  }
});
document.getElementById('google-login').addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();

  try {
    // Sign the user out first if they are logged in with a different provider
    if (auth.currentUser) {
      await signOut(auth);
      console.log("User signed out successfully");
    }

    // Check that no user is currently authenticated
    if (auth.currentUser) {
      console.error("User still logged in after sign out. Aborting.");
      return; // Abort further execution
    }

    // Proceed with Google loginsas
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log(result.user)

    const userRef = doc(firestoreDB, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      const username = prompt('Choose a username:');
      await setDoc(userRef, { username, email: user.email });
    }
    const username = await getUsername(user.uid);
    document.getElementById("container").style.display = "none";
    init(username);
    console.log("I came from google login")

  } catch (error) {
    console.error(error.message);
    alert('Error signing up with Google: ' + error.message);
  }
});
