import { Star } from './star.js';
import { Planet } from './planet.js';
import { Marker, MarkerType } from './marker.js';

export class StarSystem {
    constructor(x, y, z, scene, markerContainer, ship) {
        this.scene = scene;
        this.star = new Star(x, y, z, scene);
        this.marker = new Marker(MarkerType.StarSystem, "Undiscovered System", markerContainer, this.star.mesh, ship, 50);
        this.planets = this.generatePlanets(x, y, z);
        this.logDetails();
    }


    generatePlanets(starX, starY, starZ) {
        const planetCount = Math.floor(this.hash(starX, starY, starZ) * 5); // Deterministic planet count
        const planets = [];
        let currentDistance = 5000; // Initial distance from the star

        for (let i = 0; i < planetCount; i++) {
            const distance = currentDistance + this.hash(starX + i, starY + i, starZ + i) * 2000;
            const planetX = starX + distance; 
            const planet = new Planet(planetX, starY, starZ, this.scene); 
            planets.push(planet);
            currentDistance += 8000; 
        }

        return planets;
    }
    hash(x, y, z) {
        return Math.abs((Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453) % 1);
    }

    // Log details about the solar system
    logDetails() {
        console.log('Star System Details:');
        console.log(`Central Star: ${this.star.type.toString()}, Radius: ${this.star.size}`);
        console.log(`Number of Planets: ${this.planets.length}`);
        this.planets.forEach((planet, index) => {
            console.log(`Planet ${index + 1}: Type=${planet.type.toString()}, Radius=${planet.size}`);
        });
    }
    remove() {
        scene.remove(this.star.mesh);
        scene.remove(this.star.light);
        this.planets.forEach((planet) => {
            scene.remove(planet.mesh);
        });
    }
}
