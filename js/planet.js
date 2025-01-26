import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise@4.0.3';
import { hash } from './mathutils.js';
import { Marker, MarkerType } from './marker.js';
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
    this.geometry = new THREE.SphereGeometry(this.size, 64, 64); // Planet geometry
    this.material = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0x000000), // Non-glowing planets
      emissiveIntensity: 0,
      
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material); // Create the mesh
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);
    this.marker = new Marker(MarkerType.Planet, "Undiscovered Planet", document.getElementById("markerContainer"), this.mesh, ship, 20);
    this.generateAndApplyTexture(this.type, 1024, x, y, z);
  }
  async generateAndApplyTexture(type, size, planetX, planetY, planetZ) {
    console.log("I did a thing")
    const worker = new Worker('./js/textureWorker.js', { type: 'module' });
    console.log("i made a worker thingy")
    worker.postMessage({type, size, planetX, planetY, planetZ });
    console.log(" i posted a cool message beacause im cool")
  
    worker.onmessage = (e) => {
      const imageBitmap = e.data; // We get the ImageBitmap from the worker
      console.log("yo new ImageBitmap texture")
      const texture = new THREE.CanvasTexture(imageBitmap); // Use the ImageBitmap as a texture
      this.material.map = texture;
      this.material.needsUpdate = true;
      worker.terminate();
    };
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
  hash(x, y, z) {
    const seed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); // Large prime multipliers
    return (seed * (seed * seed * 15731 + 789221) + 1376312589) & 0x7fffffff; // Consistent pseudo-random output
  }


  // Generate texture dynamically based on planet type
  async generateTexture(type, size = 2048, planetX, planetY, planetZ) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const noise2D = createNoise2D();

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Calculate noise value for this point
        const nx = x / canvas.width - 0.5; // Normalize to -0.5 to 0.5
        const ny = y / canvas.height - 0.5; // Normalize to -0.5 to 0.5

        // Generate elevation with consistent 3D noise
        const elevation =
          0.6 * noise2D(nx * 10, ny * 10) +
          0.3 * noise2D(nx * 20, ny * 20) +
          0.1 * noise2D(nx * 40, ny * 40);

        // Handle poles (top and bottom)
        if (y < 0.05 * canvas.height || y > 0.95 * canvas.height) {
          ctx.fillStyle = `rgb(255, 255, 255)`; // White for poles
          ctx.fillRect(x, y, 1, 1);
          continue;
        }

        // Normalize elevation and apply the color map
        const normalizedElevation = Math.max(-1, Math.min(1, elevation));
        const color = this.getColorMap(type, normalizedElevation, x, y, planetX, planetY, planetZ);

        // Set pixel color
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }




  getColorMap(type, elevation, x, y, planetX, planetY, planetZ) {
    // Add subtle variations using the 3D hash function
    const hashValue = (this.hash(x + planetX, y + planetY, planetZ) % 30) - 15; // Random variation between -15 and 15

    switch (type) {
      case PlanetType.Habitable: {
        if (elevation > 0.4) {
          return [160 + elevation * 50 + hashValue, 140 + elevation * 30, 100 + elevation * 20];
        } else if (elevation > 0.1) {
          return [34 + elevation * 50 + hashValue, 139 + elevation * 60, 34 + elevation * 30];
        } else if (elevation > -0.1) {
          return [210 + hashValue, 190, 140];
        } else {
          return [0, 100 + hashValue, 200 - hashValue];
        }
      }

      case PlanetType.RockyAtmosphere: {
        if (elevation > 0.3) {
          return [200 - elevation * 60 + hashValue, 80 + hashValue, 40];
        } else if (elevation > 0.1) {
          return [210 + hashValue, 180 + hashValue, 140];
        } else {
          return [240 - elevation * 50, 220 - elevation * 30 + hashValue, 200];
        }
      }

      case PlanetType.RockyUninhabitable: {
        if (elevation > 0.2) {
          return [169 + elevation * 50, 50 + hashValue, 20];
        } else if (elevation > -0.2) {
          return [120 + hashValue, 120, 120];
        } else {
          return [80, 80, 80 + hashValue];
        }
      }

      case PlanetType.GasGiant: {
        const band = Math.sin(elevation * 10 * Math.PI) > 0 ? 255 : 200;
        return [band, 150 + elevation * 50 - hashValue, 255 - hashValue];
      }

      default:
        return [255, 255, 255]; // Default white for unknown types
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
