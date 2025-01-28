import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise@4.0.3';
import { PlanetType } from './planet.js';

self.onmessage = ({ data }) => {
  console.log("Message received.");
  const { type, size, planetX, planetY, planetZ } = data;
  const canvas = new OffscreenCanvas(size, size);
  const planetSeed = hash(planetX, planetY, planetZ); // Global seed for theme
  const themeColors = getPlanetTheme(type.name, planetSeed);
  const ctx = canvas.getContext("2d");
  const noise2D = createNoise2D();

  // Generate the noise and apply it to the canvas
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size - 0.5;
      const ny = y / size - 0.5;
      const elevation =
        0.6 * noise2D(nx * 10, ny * 10) +
        0.3 * noise2D(nx * 20, ny * 20) +
        0.1 * noise2D(nx * 40, ny * 40);

      const normalizedElevation = Math.max(-1, Math.min(1, elevation));
      const color = getColorFromElevation(
        type,
        normalizedElevation,
        themeColors
      );

      if (y < 0.05 * canvas.height || (y > 0.95 * canvas.height && type.name !== `GasGiant`)) {
        ctx.fillStyle = `rgb(255, 255, 255)`; // White for poles
        ctx.fillRect(x, y, 1, 1);
        continue;
      }

      ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  createImageBitmap(canvas).then((imageBitmap) => {
    // Send the ImageBitmap back to the main thread
    self.postMessage(imageBitmap);
  });
};

function hash(x, y, z) {
  // Mix the inputs using bit shifts and prime multipliers
  const seed = (x * 73856093 ^ y * 19349663 ^ z * 83492791);
  const result = (seed ^ (seed >> 16)) * 15731 + 789221;  // Add more mixing
  return result & 0x7fffffff;  // Ensuring the result stays positive
}


function getPlanetTheme(type, planetSeed) {
  // Derive a general color theme for the planet based on its type and seed
  switch (type) {
    case "Habitable":
      return [
        [34, 139, 34], // Green grass
        [139, 34, 139], // Purple grass
        [200, 0, 0], // Pink grass
      ][planetSeed % 3];

    case "RockyAtmosphere":
      return [200 + (planetSeed % 55), 150, 100]; // Brownish rocky colors

    case "RockyUninhabitable":
      return [255, 69 + (planetSeed % 30), 0]; // Reddish-orange

    case "GasGiant": 
      // Ensure base color has a minimum brightness
      const baseColor = [
        100 + (planetSeed % 156), // Red component (range 100–255)
        100 + ((planetSeed * 34) % 156), // Green component (range 100–255)
        100 + ((planetSeed * 54) % 156), // Blue component (range 100–255)
      ];
      console.log(baseColor)
      return baseColor;
    }
}

function getColorFromElevation(type, elevation, themeColor) {
  // Calculate color based on elevation and global theme
  switch (type.name) {
    case `Habitable`: {
      if (elevation > 0.3) {
        // High elevation: Mountainous terrain
        return [
          255,  // Add more color variation for mountains
          255,
          255,
        ];
      } else if (elevation > 0.1) {
        // Medium elevation: Plains (larger area)
        return [
          themeColor[0] + elevation * 40,  // Add more color variation for mountains
          themeColor[1] + 10 + elevation * 30,
          themeColor[2] + 5 + elevation * 20,
        ];
      } else if (elevation > -0.1) {
        // Lower plains
        return [
          themeColor[0] + elevation * 20,
          themeColor[1] + elevation * 15,
          themeColor[2] + elevation * 10,
        ];
      } else if (elevation > -0.2) {
        // Beaches (slightly lower than plains)
        return [210, 190, 140];
      } else {
        // Oceans
        return [0, 100, 200];
      }
    }
    

    case `RockyAtmosphere`: {
      if (elevation > 0.3) {
        return [
          themeColor[0] - elevation * 30,
          themeColor[1] - elevation * 20,
          themeColor[2] - elevation * 10,
        ];
      } else if (elevation > 0.1) {
        return [160, 120, 80]; // Mid-level rocky
      } else {
        return [100, 80, 60]; // Low-level rocky
      }
    }

    case `RockyUninhabitable`: {
      if (elevation > 0.2) {
        return [themeColor[0], themeColor[1] - elevation * 10, themeColor[2]];
      } else {
        return [themeColor[0] - 20, themeColor[1] - 40, themeColor[2] - 60];
      }
    }

    case `GasGiant`: {
      return [
        themeColor[0] + elevation * 20,
        themeColor[1] + elevation * 16,
        themeColor[2] + elevation * 10,
      ]; // Smooth gaseous
    }

    default:
      return [255, 255, 255]; // Default white
  }
}