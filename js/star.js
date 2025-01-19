export class StarType {
    static Neutron = new StarType("Neutron");
    static WhiteDwarf = new StarType("WhiteDwarf");
    static RedDwarf = new StarType("RedDwarf");
    static GType = new StarType("GType");
    static SubGiant = new StarType("SubGiant");
    static Giant = new StarType("Giant");
    static SuperGiant = new StarType("Giant");

    constructor(name) {
        this.name = name;
    }
    toString() {
        return `StarType.${this.name}`;
    }
}
export class Star {
    static BLOOM_LAYER = 1;
    constructor(x, y, z, scene) {
        this.size = Math.random() * 3000; // Randomized size
        this.type = this.determineType(this.size); // Star type based on size
        this.texturePath = this.getTexturePath(this.type); // Texture path based on type
        this.geometry = new THREE.SphereGeometry(this.size, 120, 120); // Star geometry
        this.texture = new THREE.TextureLoader().load(this.texturePath); // Load star texture
        this.material = new THREE.MeshStandardMaterial({
            map: this.texture,
            emissive: new THREE.Color(this.getLight()[2]),
            emissiveIntensity: 8, // Brightness
            emissiveMap: this.texture,
        });
        this.lighting = this.getLight(this.type);
        this.light = new THREE.PointLight(this.lighting[2], this.lighting[0], this.lighting[1])
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.light.position.set(x, y, z);
        this.mesh.position.set(x, y, z); // Set star position
        this.mesh.layers.set(this.BLOOM_LAYER);
        scene.add(this.mesh); // Add star to scene
        scene.add(this.light);
        this.logDetails(x, y, z); // Log star details
    }

    // Determine the type of the star based on size
    determineType(size) {
        if (size < 10) return StarType.Neutron;
        if (size < 50) return StarType.RedDwarf;
        if (size < 300) return StarType.WhiteDwarf;
        if (size < 1050) return StarType.GType;
        if (size < 10000) return StarType.SubGiant;
        if (size < 100000) return StarType.Giant;
        return StarType.SuperGiant;
    }

    // Get the texture path based on star type
    getTexturePath(type) {
        switch (type) {
            case StarType.Neutron:
                return '../assets/stars/neutron.png';
            case StarType.RedDwarf:
            case StarType.WhiteDwarf:
                return '../assets/stars/red-dwarf.jpg';
            case StarType.GType:
            case StarType.SubGiant:
            case StarType.Giant:
            case StarType.SuperGiant:
                return '../assets/solar-system/sun.jpg';
            default:
                return '../assets/solar-system/sun.jpg';
        }
    }
    getLight(type) {
        switch (type) {
            case StarType.Neutron:
                return [1.5, 1000, 0x19fbff];
            case StarType.RedDwarf:
            case StarType.WhiteDwarf:
                return [4, 25000, 0xff3421];
            case StarType.GType:
                return [8, 145000, 0xffe675];
            case StarType.SubGiant:
            case StarType.Giant:
                return [15, 300000, 0xffea00];
            case StarType.SuperGiant:
                return [45, 1000000, 0xffea00];
            default:
                return 1.0;
        }
    }

    // Get the emissive intensity based on star type
    getEmissiveIntensity(type) {
        switch (type) {
            case StarType.Neutron:
                return Math.random() * 0.5 + 0.2; // Dimmer stars
            case StarType.RedDwarf:
            case StarType.WhiteDwarf:
                return Math.random() * 1.0 + 0.5;
            case StarType.GType:
                return 2.0; // Sun-like stars
            case StarType.SubGiant:
            case StarType.Giant:
                return Math.random() * 5.0 + 2.0; // Brighter stars
            case StarType.SuperGiant:
                return Math.random() * 10.0 + 5.0; // Extremely bright stars
            default:
                return 1.0;
        }
    }

    // Log the details of the star
    logDetails(x, y, z) {
        console.log(`Loaded star - full star details:
        Type: ${this.type.toString()}
        Radius: ${this.size}
        Position x: ${x}, y: ${y}, z: ${z}
      `);
    }
}
