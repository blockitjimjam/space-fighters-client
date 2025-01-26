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
  const seaLevelOffset = (hash(x + planetX + 10, y + planetY + 10, planetZ + 10) % 20) - 10;

  switch (type.name) {
    case `Habitable`: {
      // Variations in grass colors
      const grassColors = [
        [34, 139, 34], // Green grass
        [139, 34, 139], // Purple grass
        [255, 20, 147], // Pink grass
      ];
      const grassColor = grassColors[Math.abs(hashValue) % grassColors.length];

      if (elevation > 0.4 + seaLevelOffset / 100) {
        return [160 + elevation * 50 + hashValue, 140 + elevation * 30, 100 + elevation * 20];
      } else if (elevation > 0.1 + seaLevelOffset / 100) {
        return [
          grassColor[0] + elevation * 50 + hashValue,
          grassColor[1] + elevation * 60,
          grassColor[2] + elevation * 30,
        ];
      } else if (elevation > -0.1 + seaLevelOffset / 100) {
        return [210 + hashValue, 190, 140];
      } else {
        return [0, 100 + hashValue, 200 - hashValue];
      }
    }

    case `RockyAtmosphere`: {
      if (elevation > 0.3) {
        return [255 - elevation * 60 + hashValue, 200 - elevation * 50, 100 - elevation * 30];
      } else if (elevation > 0.1) {
        return [240 - elevation * 40 + hashValue, 160 - elevation * 30, 60];
      } else {
        return [220 - elevation * 50, 140 - elevation * 30 + hashValue, 40];
      }
    }

    case `RockyUninhabitable`: {
      if (elevation > 0.2) {
        return [255 - elevation * 50 + hashValue, 69, 0];
      } else if (elevation > -0.2) {
        return [255 - elevation * 20 + hashValue, 140, 0];
      } else {
        return [139, 69, 19 + hashValue];
      }
    }

    case `GasGiant`: {
      // Smooth random base color
      const baseColor = [
        Math.abs(hashValue * 8) % 256,
        Math.abs(hashValue * 5) % 256,
        Math.abs(hashValue * 3) % 256,
      ];
      return [
        baseColor[0] + elevation * 20,
        baseColor[1] + elevation * 15,
        baseColor[2] + elevation * 10,
      ];
    }

    default:
      return [255, 255, 255]; // Default white for unknown types
  }
}