export class SolarSystem {
    constructor(scene) {
        let textureLoader = new THREE.TextureLoader();

        // Mercury
        let mercuryGeometry = new THREE.SphereGeometry(3.42, 120, 120);
        let mercuryTexture = textureLoader.load('./assets/solar-system/mercury.jpg');
        let mercuryMaterial = new THREE.MeshStandardMaterial({ map: mercuryTexture });
        let mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
        mercury.position.set(3050, 0, 0);
        scene.add(mercury);

        // Venus
        let venusGeometry = new THREE.SphereGeometry(8.55, 120, 120);
        let venusTexture = textureLoader.load('./assets/solar-system/venus.jpg');
        let venusMaterial = new THREE.MeshStandardMaterial({ map: venusTexture });
        let venus = new THREE.Mesh(venusGeometry, venusMaterial);
        venus.position.set(1400, 0, 0);
        scene.add(venus);

        // Earth
        let earthGeometry = new THREE.SphereGeometry(9, 120, 120);
        let earthTexture = textureLoader.load('./assets/solar-system/earth.jpg');
        let earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
        window.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(0, 0, 0);
        scene.add(earth);

        // Mars
        let marsGeometry = new THREE.SphereGeometry(4.77, 120, 120);
        let marsTexture = textureLoader.load('./assets/solar-system/mars.jpg');
        let marsMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
        let mars = new THREE.Mesh(marsGeometry, marsMaterial);
        mars.position.set(-2600, 0, 0);
        scene.add(mars);

        // Jupiter
        let jupiterGeometry = new THREE.SphereGeometry(100.89, 120, 120);
        let jupiterTexture = textureLoader.load('./assets/solar-system/jupiter.jpg');
        let jupiterMaterial = new THREE.MeshStandardMaterial({ map: jupiterTexture });
        let jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
        jupiter.position.set(-21000, 0, 0);
        scene.add(jupiter);

        // Saturn
        let saturnGeometry = new THREE.SphereGeometry(85.05, 120, 120);
        let saturnTexture = textureLoader.load('./assets/solar-system/saturn.jpg');
        let saturnMaterial = new THREE.MeshStandardMaterial({ map: saturnTexture });
        let saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
        saturn.position.set(-42900, 0, 0);
        scene.add(saturn);

        // Uranus
        let uranusGeometry = new THREE.SphereGeometry(36.09, 120, 120);
        let uranusTexture = textureLoader.load('./assets/solar-system/uranus.jpg');
        let uranusMaterial = new THREE.MeshStandardMaterial({ map: uranusTexture });
        let uranus = new THREE.Mesh(uranusGeometry, uranusMaterial);
        uranus.position.set(-91100, 0, 0);
        scene.add(uranus);

        // Neptune
        let neptuneGeometry = new THREE.SphereGeometry(34.92, 120, 120);
        let neptuneTexture = textureLoader.load('./assets/solar-system/neptune.jpg');
        let neptuneMaterial = new THREE.MeshStandardMaterial({ map: neptuneTexture });
        let neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);
        neptune.position.set(-145250, 0, 0);
        scene.add(neptune);

    }
}