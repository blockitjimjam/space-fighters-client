import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise@4.0.3';
import { PlanetType } from './planet.js';
self.onmessage = ({ data }) => {
  console.log("Message received.");
  const { type, size, planetX, planetY, planetZ} = data;
  const canvas = new OffscreenCanvas(size, size);

  const ctx = canvas.getContext('2d');
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
      const color = getColorMap(type, normalizedElevation, x, y, planetX, planetY, planetZ);
      if (y < 0.05 * canvas.height || y > 0.95 * canvas.height && type.name != `GasGiant`) {
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
  const seed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); // Large prime multipliers
  return (seed * (seed * seed * 15731 + 789221) + 1376312589) & 0x7fffffff; // Consistent pseudo-random output
}
function getColorMap(type, elevation, x, y, planetX, planetY, planetZ) {
  // Add subtle variations using the 3D hash function
  const hashValue = (hash(x + planetX, y + planetY, planetZ) % 30) - 15;

  switch (type.name) {
    case `Habitable`: {
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

    case `RockyAtmosphere`: {
      if (elevation > 0.3) {
        return [200 - elevation * 60 + hashValue, 80 + hashValue, 40];
      } else if (elevation > 0.1) {
        return [210 + hashValue, 180 + hashValue, 140];
      } else {
        return [240 - elevation * 50, 220 - elevation * 30 + hashValue, 200];
      }
    }

    case `RockyUninhabitable`: {
      if (elevation > 0.2) {
        return [169 + elevation * 50, 50 + hashValue, 20];
      } else if (elevation > -0.2) {
        return [120 + hashValue, 120, 120];
      } else {
        return [80, 80, 80 + hashValue];
      }
    }

    case `GasGiant`: {
      const band = Math.sin(elevation * 10 * Math.PI) > 0 ? 255 : 200;
      return [band, 150 + elevation * 50 - hashValue, 255 - hashValue];
    }

    default:
      return [255, 255, 255]; // Default white for unknown types
  }
}
