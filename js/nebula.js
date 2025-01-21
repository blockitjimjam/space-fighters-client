export class Nebula {
    constructor(scene, position, mainRadius = 1000, sphereCount = 3, particleCount = 5000) {
      this.scene = scene; // Reference to the Three.js scene
      this.position = position; // Central position of the nebula (Vector3)
      this.mainRadius = mainRadius; // Radius of the central sphere
      this.sphereCount = sphereCount; // Number of additional connected spheres
      this.particleCount = particleCount; // Total number of particles
      this.spheres = []; // Store individual spheres for reference
  
      this.initNebula();
    }
  
    // Initialize the nebula
    initNebula() {
      const totalParticlesPerSphere = Math.floor(this.particleCount / this.sphereCount);
  
      for (let i = 0; i < this.sphereCount; i++) {
        const sphereRadius = this.mainRadius * (0.8 + Math.random() * 0.4); // Slight variation in size
  
        // Randomly position spheres near the main position
        const offsetX = (Math.random() - 0.5) * this.mainRadius * 2;
        const offsetY = (Math.random() - 0.5) * this.mainRadius * 2;
        const offsetZ = (Math.random() - 0.5) * this.mainRadius * 2;
        const spherePosition = new THREE.Vector3(
          this.position.x + offsetX,
          this.position.y + offsetY,
          this.position.z + offsetZ
        );
  
        this.createSphereParticles(spherePosition, sphereRadius, totalParticlesPerSphere);
      }
    }
  
    // Create particles for a sphere
    createSphereParticles(position, radius, particleCount, baseColor = new THREE.Color(0x008F39)) {
        const particlePositions = new Float32Array(particleCount * 3);
        const particleColors = new Float32Array(particleCount * 3);
      
        function generateColorWithVariation(baseColor) {
          // Convert base color to HSL
          const hslBase = baseColor.getHSL({});
          
          // Apply slight random variation to the hue, keeping saturation and lightness constant
          const hueVariation = (Math.random() - 0.5) * 0.1; // Slight hue shift, between -5% and 5%
          const newHue = Math.min(Math.max(hslBase.h + hueVariation, 0), 1); // Ensure hue is within [0, 1]
      
          // Convert back to RGB and return the color
          const newColor = new THREE.Color();
          newColor.setHSL(newHue, hslBase.s, hslBase.l);
      
          return newColor;
        }
      
        for (let i = 0; i < particleCount; i++) {
          // Generate random position within a sphere
          const phi = Math.random() * Math.PI * 2;
          const costheta = Math.random() * 2 - 1;
          const u = Math.random();
          const r = radius * Math.cbrt(u);
      
          const x = r * Math.sqrt(1 - costheta * costheta) * Math.cos(phi);
          const y = r * Math.sqrt(1 - costheta * costheta) * Math.sin(phi);
          const z = r * costheta;
      
          particlePositions[i * 3] = position.x + x;
          particlePositions[i * 3 + 1] = position.y + y;
          particlePositions[i * 3 + 2] = position.z + z;
      
          // Generate the color with slight hue variation
          const color = generateColorWithVariation(baseColor);
          particleColors[i * 3] = color.r;
          particleColors[i * 3 + 1] = color.g;
          particleColors[i * 3 + 2] = color.b;
        }
      
        // Create particle system
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
      
        const material = new THREE.PointsMaterial({
          size: 10,
          vertexColors: true,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
      
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.spheres.push(particles); // Store reference to the particles
      }
      
    
    // Add a wireframe sphere container
    /*addSphereContainer(position, radius) {
      const containerGeometry = new THREE.SphereGeometry(radius, 32, 32);
      const containerMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
  
      const container = new THREE.Mesh(containerGeometry, containerMaterial);
      container.position.set(position.x, position.y, position.z);
      this.scene.add(container);
      this.spheres.push(container); // Store reference to the container
    }*/
  
    // Animate the particles
    animate(deltaTime) {
      for (const sphere of this.spheres) {
        sphere.rotation.y += deltaTime * 0.05; // Rotate for dynamic effect
      }
    }
  }
  