import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise@4.0.3';
import { hash } from './app.js';
export class PlanetType {
    static Habitable = new PlanetType("Habitable");
    static RockyAtmosphere = new PlanetType("RockyAtmosphere");
    static RockyUninhabitable = new PlanetType("RockyUninhabitable");
    static GasGiant = new PlanetType("GasGiant");
  
    constructor(name) {
      this.name = name;
    }
  
    toString() {
      return `PlanetType.${this.name}`;
    }
  }
  
  export class Planet {
    constructor(x, y, z, scene) {
      this.size = this.calculateSize(x, y, z); // Determine size based on type
      this.type = this.determineType(this.size); // Planet type
      this.texture = this.generateTexture(this.type, this.size); // Dynamically generated texture
      this.geometry = new THREE.SphereGeometry(this.size, 64, 64); // Planet geometry
      this.material = new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(this.texture), // Use generated texture
        emissive: new THREE.Color(0x000000), // Non-glowing planets
        emissiveIntensity: 0,
      });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.position.set(x, y, z);
      scene.add(this.mesh); // Add planet to scenes
    }
  
    // Determine the type of the planet based on size
    determineType(size) {
      if (size < 15) return PlanetType.Habitable;
      if (size < 25) return PlanetType.RockyAtmosphere;
      if (size < 35) return PlanetType.RockyUninhabitable;
      return PlanetType.GasGiant;
    }
  
    // Generate planet size based on type
    calculateSize(x, y, z) {
        const noise = hash(x, y, z);
        return noise * 50; // Scale the size (adjust 3000 as needed)
    }
  
    // Generate texture dynamically based on planet type
    generateTexture(type, size) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const noise2D = createNoise2D();
  
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const nx = x / canvas.width - 0.5;
          const ny = y / canvas.height - 0.5;
          const elevation = noise2D(nx * 10, ny * 10); // Scale for detail
          const color = this.getColorMap(type, elevation); // Get color based on type and elevation
  
          // Set pixel color
          const index = (y * canvas.width + x) * 4;
          ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      return canvas;
    }
  
    // Get a color map for the planet based on type and elevation
    getColorMap(type, elevation) {
      switch (type) {
        case PlanetType.Habitable:
          return elevation > 0 ? [34, 139, 34] : [0, 105, 148]; // Green for land, blue for water
        case PlanetType.RockyAtmosphere:
          return elevation > 0 ? [139, 69, 19] : [210, 180, 140]; // Brown and tan
        case PlanetType.RockyUninhabitable:
          return elevation > 0 ? [169, 169, 169] : [105, 105, 105]; // Dark gray tones
        case PlanetType.GasGiant:
          const gasColor = Math.floor((elevation + 1) * 128); // Gradient
          return [gasColor, gasColor, 255]; // Blue hues
        default:
          return [255, 255, 255]; // Default to white
      }
    }
  
    // Log planet details
    logDetails(x, y, z) {
      console.log(`Loaded planet - full details:
        Type: ${this.type.toString()}
        Radius: ${this.size}
        Position: x=${x}, y=${y}, z=${z}
      `);
    }
  }
  