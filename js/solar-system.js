export class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
        this.planets = {};
        
        // Constants
        this.EARTH_TILT = 23.5 * (Math.PI / 180);

        // Create other planets normally...
        this.createPlanet('mercury', 3.42, './assets/solar-system/mercury.jpg', { x: 3050, y: 0, z: 0 });
        this.createPlanet('venus', 8.55, './assets/solar-system/venus.jpg', { x: 1400, y: 0, z: 0 });
        this.createPlanet('mars', 4.77, './assets/solar-system/mars.jpg', { x: -2600, y: 0, z: 0 });
        this.createPlanet('jupiter', 100.89, './assets/solar-system/jupiter.jpg', { x: -21000, y: 0, z: 0 });
        this.createPlanet('saturn', 85.05, './assets/solar-system/saturn.jpg', { x: -42900, y: 0, z: 0 });
        this.createPlanet('uranus', 36.09, './assets/solar-system/uranus.jpg', { x: -91100, y: 0, z: 0 });
        this.createPlanet('neptune', 34.92, './assets/solar-system/neptune.jpg', { x: -145250, y: 0, z: 0 });
        
        // Specialized Earth setup
        this.setupEarth();
    }

    setupEarth() {
        // 1. Create a container for the Earth to handle the tilt
        this.earthGroup = new THREE.Group();
        
        // 2. Create the Earth Mesh
        const geometry = new THREE.SphereGeometry(9, 120, 120);
        const texture = this.textureLoader.load('./assets/solar-system/earth.jpg');
        const material = new THREE.MeshStandardMaterial({ map: texture });
        this.earthMesh = new THREE.Mesh(geometry, material);
        
        // 3. Apply the Tilt to the Group
        this.earthGroup.rotation.z = this.EARTH_TILT;
        
        // 4. Add mesh to group, and group to scene
        this.earthGroup.add(this.earthMesh);
        this.scene.add(this.earthGroup);
        
        // Store reference
        this.planets['earth'] = this.earthMesh; 
    }
       createPlanet(name, radius, texturePath, position) {
        const geometry = new THREE.SphereGeometry(radius, 120, 120);
        const texture = this.textureLoader.load(texturePath);
        const material = new THREE.MeshStandardMaterial({ map: texture, emissive: new THREE.Color(0x000000) });
        const planet = new THREE.Mesh(geometry, material);

        planet.position.set(position.x, position.y, position.z);
        this.scene.add(planet);

        this.planets[name] = planet;
    }

update() {
    const now = new Date();
    
    const secondsPassedToday = (now.getUTCHours() * 3600) + 
                               (now.getUTCMinutes() * 60) + 
                               now.getUTCSeconds();
    const dayFraction = secondsPassedToday / 86400;

    this.earthMesh.rotation.y = (dayFraction * Math.PI * 2) + Math.PI;

    const startOfYear = new Date(now.getUTCFullYear(), 0, 1);
    const dayOfYear = (now - startOfYear) / (1000 * 60 * 60 * 24);

    const seasonalTilt = Math.cos((dayOfYear - 172) * (Math.PI * 2 / 365)) * this.EARTH_TILT;
    this.earthGroup.rotation.z = seasonalTilt;
}
}
