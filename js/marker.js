export class MarkerType {
        static Planet = new MarkerType({marker: "planet", color: "#348ceb", class: "planet-label"});
        static Star = new MarkerType({marker: "star", color: "#ffffff", class: "star-label"});
      
        constructor(name) {
          this.name = name;
        }
        toString() {
          return `MarkerType.${this.name}`;
        }
}

export class Marker {
    constructor(type, name, container, model, ship) {
        const marker = document.createElement('div');
        marker.className = 'player-text planet-text-border';
        marker.innerHTML = `<div class='${type.name.class}'>${type.name.marker}</div>${name}<div id='au-counter'></div>`;
        marker.style.position = 'absolute';
        marker.style.transform = 'translate(-50%, -100%)';
        this.model = model;
        this.marker = marker;
        this.ship = ship;
        container.appendChild(marker);
    }
    update() {
        if (this.model && this.marker && this.ship) {
            const playerPosition = this.model.position.clone();
            const screenPosition = worldToScreen(playerPosition);
    
            // Check if the player is in view
            const inView = isPlayerInView(playerPosition);
            const distance = playerPosition.distanceTo(this.ship.position);
            const distanceInAU = distance / 5000;
    
            // If the player is in view, update the position of the text
            if (inView && distanceInAU < 10000000) {
            this.marker.style.left = `${screenPosition.x}px`;
            this.marker.style.top = `${screenPosition.y - 10}px`;
            this.marker.style.display = 'block'; // Show the label
            this.marker.querySelector("#au-counter").textContent = `${distanceInAU.toFixed(5)} AU`;
            } else {
            this.marker.style.display = 'none'; 
            }
        }
    }
}