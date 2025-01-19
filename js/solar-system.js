export class SolarSystem {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
        this.planets = {};

        this.createPlanet('mercury', 3.42, './assets/solar-system/mercury.jpg', { x: 3050, y: 0, z: 0 });
        this.createPlanet('venus', 8.55, './assets/solar-system/venus.jpg', { x: 1400, y: 0, z: 0 });
        this.createPlanet('earth', 9, './assets/solar-system/earth.jpg', { x: 0, y: 0, z: 0 });
        this.createPlanet('mars', 4.77, './assets/solar-system/mars.jpg', { x: -2600, y: 0, z: 0 });
        this.createPlanet('jupiter', 100.89, './assets/solar-system/jupiter.jpg', { x: -21000, y: 0, z: 0 });
        this.createPlanet('saturn', 85.05, './assets/solar-system/saturn.jpg', { x: -42900, y: 0, z: 0 });
        this.createPlanet('uranus', 36.09, './assets/solar-system/uranus.jpg', { x: -91100, y: 0, z: 0 });
        this.createPlanet('neptune', 34.92, './assets/solar-system/neptune.jpg', { x: -145250, y: 0, z: 0 });
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
        this.planets["earth"].rotation.y += 0.00005
    }
}
