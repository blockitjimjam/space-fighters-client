export class Laser {
    constructor(scene, position, rotation, speed, range) {
      this.scene = scene;
      this.speed = speed; 
      this.range = range; 
      this.position = position;
      this.rotation = rotation;
      this.travelled = 0; 
  

      const points = [
        new THREE.Vector3(0, 0, 0), 
        new THREE.Vector3(0, 0, 1)  
      ];
      this.geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.material = new THREE.LineBasicMaterial({ color: 0xffff00 });

      this.line = new THREE.Line(this.geometry, this.material);
      this.line.position.copy(position); 
      const invertedRotation = rotation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0))); // Flip the X axis
      this.line.rotation.setFromQuaternion(invertedRotation);
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