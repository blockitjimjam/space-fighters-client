export function hash(x, y, z) {
    return Math.abs((Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453) % 1);
}