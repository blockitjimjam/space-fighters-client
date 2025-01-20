import { ref, set } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
export class Laser {
  constructor(scene, position, rotation, speed, range, id, otherPlayers, db) {
    this.scene = scene;
    this.speed = speed; 
    this.range = range; 
    this.position = position;
    this.rotation = rotation;
    this.travelled = 0; 
    this.id = id;
    this.otherPlayers = otherPlayers; 
    this.db = db;

    const points = [
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(0, 0, 1)  
    ];
    this.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    this.line = new THREE.Line(this.geometry, this.material);
    this.line.position.copy(position); 
    const invertedRotation = rotation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0))); // Flip the X axis
    this.line.rotation.setFromQuaternion(invertedRotation);
    this.scene.add(this.line);
  }

  // Function to send damage data to Firebase
  sendDamageToDatabase(playerId) {
    const hitRef = ref(this.db, `hit/${playerId}`);
    set(hitRef, {
      damage: 20
    }).then(() => {
      console.log(`Damage data sent to Firebase for player ${playerId}`);
    }).catch((error) => {
      console.error("Error sending damage data to Firebase: ", error);
    });
  }

  checkHit() {
    const hitRadius = 0.02;

    for (let playerId in this.otherPlayers) {
      const player = this.otherPlayers[playerId];
      const distance = this.line.position.distanceTo(player.position);

      if (distance <= hitRadius) {
        console.log(`Laser hit player with ID: ${playerId}`);
        this.sendDamageToDatabase(playerId);
        return true; 
      }
    }

    return false; 
  }
  update(deltaTime) {
    const distance = this.speed * deltaTime;

    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.line.quaternion).normalize();
    const movement = direction.multiplyScalar(distance);
    this.line.position.add(movement);

    this.travelled += distance;


    if (this.checkHit()) {
      this.scene.remove(this.line); 
      return false; 
    }

    if (this.travelled >= this.range) {
      this.scene.remove(this.line);
      return false; 
    }
  
    return true; 
  }
}

export class MultiplayerLaser {
  constructor(scene, positionArray, rotationArray, speed, range, id) {
    this.scene = scene;
    this.speed = speed; 
    this.range = range; 
    this.travelled = 0;
    this.id = id;
    console.log("new laser");

    // Convert position and rotation arrays to THREE.Vector3 and THREE.Quaternion
    const position = new THREE.Vector3(...positionArray);
    const rotationQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...rotationArray)
    );

    // Define laser geometry and material
    const points = [
      new THREE.Vector3(0, 0, 0), // Start point
      new THREE.Vector3(0, 0, 1)  // End point
    ];
    this.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    // Create the laser line
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.position.copy(position); 
    const invertedRotation = rotationQuaternion.clone().multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0)) // Flip the X axis
    );
    this.line.rotation.setFromQuaternion(invertedRotation);

    // Add the line to the scene
    this.scene.add(this.line);
  }

  update(deltaTime) {
    const distance = this.speed * deltaTime;


    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.line.quaternion).normalize();
    const movement = direction.multiplyScalar(distance);
    this.line.position.add(movement);

    this.travelled += distance;
    if (this.travelled >= this.range) {
      this.scene.remove(this.line);
      return false; 
    }

    return true; 
  }
}
