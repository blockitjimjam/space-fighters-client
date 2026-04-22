import { Marker } from "./marker.js";

export class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
        this.planets = {};

        this.EARTH_TILT = 23.5 * (Math.PI / 180);

        // Orbital Periods in Earth Days
        this.orbitalData = {
            mercury: { period: 87.97, radius: 3050 },
            venus:   { period: 224.7, radius: 4500 }, // Adjusted to be between Merc/Mars
            earth:   { period: 365.26, radius: 6000 },
            mars:    { period: 686.98, radius: 8500 },
            jupiter: { period: 4332.59, radius: 21000 },
            saturn:  { period: 10759.22, radius: 42900 },
            uranus:  { period: 30685.4, radius: 91100 },
            neptune: { period: 60189.0, radius: 145250 }
        };

        // Create Planets
        this.createPlanet('mercury', 3.42, './assets/solar-system/mercury.jpg');
        this.createPlanet('venus', 8.55, './assets/solar-system/venus.jpg');
        this.createPlanet('mars', 4.77, './assets/solar-system/mars.jpg');
        this.createPlanet('jupiter', 100.89, './assets/solar-system/jupiter.jpg');
        this.createPlanet('saturn', 85.05, './assets/solar-system/saturn.jpg');
        this.createPlanet('uranus', 36.09, './assets/solar-system/uranus.jpg');
        this.createPlanet('neptune', 34.92, './assets/solar-system/neptune.jpg');

        this.setupEarth();
        // add all planets to markers
    }

    createPlanet(name, radius, texturePath) {
        const geometry = new THREE.SphereGeometry(radius, 120, 120);
        const texture = this.textureLoader.load(texturePath);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const planet = new THREE.Mesh(geometry, material);

        this.scene.add(planet);
        this.planets[name] = planet;
    }

    setupEarth() {
        this.earthGroup = new THREE.Group();

        // Surface
        const earthGeometry = new THREE.SphereGeometry(9, 120, 120);
        const earthTexture = this.textureLoader.load('./assets/solar-system/earth.jpg');
        const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.7 });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
          let atmosphereGeometry = new THREE.SphereGeometry(9.2, 120, 120); // Slightly larger than the Earth
          let atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb, // Light blue color
            transparent: true,
            depthWrite: false,
            opacity: 0.18, // Adjust opacity for a subtle effect
          });
          this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

        // Clouds (Using that beautiful 8K texture)
        const cloudGeometry = new THREE.SphereGeometry(9.1, 120, 120);
        const cloudTexture = this.textureLoader.load("https://clouds.matteason.co.uk/images/8192x4096/clouds-alpha.png");
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

        // Build Earth
        this.earthGroup.add(this.earthMesh);
        this.earthGroup.add(this.cloudMesh);
        this.earthGroup.add(this.atmosphere);
        this.scene.add(this.earthGroup);
    }

    update() {
        const now = new Date();
        const timestamp = now.getTime(); // Total milliseconds for smooth orbit
        
        // Days passed since a reference point (roughly J2000)
        const daysPassed = timestamp / (1000 * 60 * 60 * 24);

        // Update All Planets (Except Earth, handled separately below)
        Object.keys(this.planets).forEach(name => {
            const data = this.orbitalData[name];
            if (data && name !== 'earth') {
                // Calculate orbital position
                const angle = (daysPassed / data.period) * Math.PI * 2;
                this.planets[name].position.x = Math.cos(angle) * data.radius;
                this.planets[name].position.z = Math.sin(angle) * data.radius;
                
                // Slowly rotate the planet on its own axis
                this.planets[name].rotation.y += 0.001;
            }
        });

        // Specialized Earth Update
        const earthData = this.orbitalData.earth;
        const earthAngle = (daysPassed / earthData.period) * Math.PI * 2;
        
        // Move the whole Earth Group (tilt + meshes)
        this.earthGroup.position.x = Math.cos(earthAngle) * earthData.radius;
        this.earthGroup.position.z = Math.sin(earthAngle) * earthData.radius;

        // Daily Rotation
        const secondsPassedToday = (now.getUTCHours() * 3600) + (now.getUTCMinutes() * 60) + now.getUTCSeconds();
        const dayFraction = secondsPassedToday / 86400;
        const dailyRotation = (dayFraction * Math.PI * 2) + Math.PI;

        this.earthMesh.rotation.y = dailyRotation;
        this.cloudMesh.rotation.y = dailyRotation;

        // Seasonal Axial Tilt
        const startOfYear = new Date(now.getUTCFullYear(), 0, 1);
        const dayOfYear = (now - startOfYear) / (1000 * 60 * 60 * 24);
        const seasonalTilt = Math.cos((dayOfYear - 172) * (Math.PI * 2 / 365)) * this.EARTH_TILT;
        this.earthGroup.rotation.z = seasonalTilt;
    }
}