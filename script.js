import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let earth, earthOrbit;
let planetData = {};
let orbitGroups = {};
let isPaused = false;
let stars;
let isDarkMode = true;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");




function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
 camera.position.set(0, 30, 60);
camera.lookAt(0, 0, 0);


  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

 // Point Light (simulates sunlight from center)
const sunLight = new THREE.PointLight(0xffffff, 0.9, 500);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);



// Ambient Light (softens dark areas)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // brightness: 0.3
scene.add(ambientLight);

scene.background = new THREE.Color(0x000000); // pure black is okay




// Planet Definitions: [name, radius, distance, color, orbitSpeed]
const planets = [
  ["mercury", 1.5, 8, 0xa9a9a9, 0.04],
  ["venus", 2.5, 12, 0xeccc9a, 0.015],
  ["earth", 3, 16, 0x2a5eff, 0.01],
  ["mars", 2.2, 20, 0xff4500, 0.008],
  ["jupiter", 6.5, 28, 0xd2b48c, 0.004],
  ["saturn", 5.5, 36, 0xf5deb3, 0.003],
  ["uranus", 4, 43, 0x00ffff, 0.002],
  ["neptune", 4, 50, 0x4169e1, 0.0015]
];
const textureLoader = new THREE.TextureLoader();
const sunTexture = textureLoader.load("textures/sun.jpg");

const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create planets with orbit groups
planets.forEach(([name, radius, distance, color, speed]) => {
  const orbitGroup = new THREE.Object3D();
  orbitGroups[name] = orbitGroup;
  scene.add(orbitGroup);

  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(`textures/${name}.jpg`);
const material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 1,
  metalness: 0
});


  const planet = new THREE.Mesh(geometry, material);

  planet.position.x = distance;
  orbitGroup.add(planet);
  if (name === "saturn") {
  const ringGeometry = new THREE.RingGeometry(radius + 1.5, radius + 4, 64);
  const ringTexture = textureLoader.load("textures/saturn_ring.png");

  const ringMaterial = new THREE.MeshBasicMaterial({
    map: ringTexture,
    side: THREE.DoubleSide,
    transparent: true
  });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);

  // Rotate ring to lie flat in XZ plane
  ring.rotation.x = -Math.PI / 2;

  // Position ring at the same distance as Saturn
  ring.position.x = distance;

  orbitGroup.add(ring);
}


  planetData[name] = {
    mesh: planet,
    speed: speed
  };
});
document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").innerText = isPaused ? "Resume" : "Pause";
});


    addStarfield();

  animate();
  setupSpeedControls(); 

}
window.addEventListener("mousemove", (event) => {
  // Normalize mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const planetMeshes = Object.values(planetData).map(p => p.mesh);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const planet = intersects[0].object;

    for (const name in planetData) {
      if (planetData[name].mesh === planet) {
        tooltip.innerText = name.charAt(0).toUpperCase() + name.slice(1);
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY + 12}px`;
        tooltip.style.display = "block";
        return;
      }
    }
  } else {
    tooltip.style.display = "none";
  }
});

setupThemeToggle();

function setupThemeToggle() {
  const button = document.getElementById("toggleTheme");

  button.addEventListener("click", () => {
    isDarkMode = !isDarkMode;

    // Change scene background
    scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xffffff);

    // Update UI background (optional)
    document.body.style.backgroundColor = isDarkMode ? "black" : "white";
    document.body.style.color = isDarkMode ? "white" : "black";

    // Optional: adjust star visibility or other effects here
  });
}

function addStarfield() {
  const starCount = 2000; // You can increase this for a denser starfield
  const positions = [];

  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    sizeAttenuation: true,
  });

  stars = new THREE.Points(geometry, material);
scene.add(stars);

}

function setupSpeedControls() {
  Object.keys(planetData).forEach((planet) => {
    const slider = document.getElementById(`${planet}Speed`);
    if (slider) {
      slider.addEventListener("input", (e) => {
        const newSpeed = parseFloat(e.target.value);
        planetData[planet].speed = newSpeed;
      });
    }
  });
}


setupSpeedControls();

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    Object.keys(orbitGroups).forEach((name) => {
      orbitGroups[name].rotation.y += planetData[name].speed;
      planetData[name].mesh.rotation.y += 0.02;
    });
  }
  if (stars) stars.rotation.y += 0.0002;

  renderer.render(scene, camera); // Always render, even when paused
}



init();
