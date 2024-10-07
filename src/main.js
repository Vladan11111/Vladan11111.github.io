import * as THREE from '../node_modules/three';
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
//import { OrbitControls } from './OrbitControls.js';

let data;
//fetch("http://localhost:3500/api-csv").then((data) => console.log(data));

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls (360 camera with zoom)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;

// Texture Loader
const textureLoader = new THREE.TextureLoader();
let sun;  // Declare the sun variable globally
let focusOnEarth = false;  // Track if we are focusing on Earth

// Create Sun (center of the solar system)
function createSun() {
    const sunTexture = textureLoader.load('textures/sun.jpg');
    const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
}

// Create the initial sun and lighting
createSun();

// Add a PointLight at the Sun's position to light up the planets
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Initial planet data
const planetsData = [
  { name: 'Mercury', text: "The closest planet to the Sun, Mercury is a small, rocky world with extreme temperature fluctuations.", size: 0.2, distance: 2, speed: 0.04, texture: 'textures/mercury.jpg', rotationSpeed: 0.005, inclinationX: 7, inclinationZ: 5, realSize: '4,879 km', realSpeed: '172,332 km/h' },
  { name: 'Venus', text: "Known for its thick, toxic atmosphere and scorching surface temperatures, Venus is often called Earth's sister planet.", size: 0.3, distance: 3, speed: 0.015, texture: 'textures/venus.jpg', rotationSpeed: 0.004, inclinationX: 3.39, inclinationZ: 2, realSize: '12,104 km', realSpeed: '126,074 km/h' },
  { name: 'Earth', text: "The only planet known to support life, Earth has a balanced climate, liquid water, and a diverse range of ecosystems.", size: 0.35, distance: 4, speed: 0.01, texture: 'textures/earth.jpg', rotationSpeed: 0.01, inclinationX: 0, inclinationZ: 0, realSize: '12,742 km', realSpeed: '107,226 km/h' },
  { name: 'Mars', text: "The 'Red Planet', Mars has a thin atmosphere and is home to the largest volcano and canyon in the solar system.", size: 0.25, distance: 5, speed: 0.008, texture: 'textures/mars.jpg', rotationSpeed: 0.008, inclinationX: 1.85, inclinationZ: 1, realSize: '6,779 km', realSpeed: '86,871 km/h' },
  { name: 'Jupiter', text: "The largest planet in the solar system, Jupiter is a gas giant with powerful storms, including the famous Great Red Spot.", size: 0.7, distance: 7, speed: 0.002, texture: 'textures/jupiter.jpg', rotationSpeed: 0.02, inclinationX: 1.3, inclinationZ: 0.5, realSize: '139,820 km', realSpeed: '47,002 km/h' },
  { name: 'Saturn', text: "Saturn is best known for its stunning ring system, made up of ice and rock particles orbiting the gas giant.", size: 0.6, distance: 9, speed: 0.0017, texture: 'textures/saturn.jpg', rotationSpeed: 0.018, inclinationX: 2.49, inclinationZ: 3, realSize: '116,460 km', realSpeed: '34,701 km/h' },
  { name: 'Uranus', text: "An ice giant with a tilted axis, Uranus rotates on its side, giving it extreme seasonal variations.", size: 0.5, distance: 11, speed: 0.0012, texture: 'textures/uranus.jpg', rotationSpeed: 0.014, inclinationX: 0.77, inclinationZ: 0.3, realSize: '50,724 km', realSpeed: '24,477 km/h' },
  { name: 'Neptune', text: "The farthest planet from the Sun, Neptune has strong winds and violent storms in its deep blue atmosphere.", size: 0.45, distance: 13, speed: 0.001, texture: 'textures/neptune.jpg', rotationSpeed: 0.012, inclinationX: 1.77, inclinationZ: 1.5, realSize: '49,244 km', realSpeed: '19,566 km/h' },
];

const newData = [
  { name: 'Mercury', size: 0.1, distance: 0.57, speed: 0.0000004787, texture: 'textures/mercury.jpg', rotationSpeed: 0.005 },
  { name: 'Venus', size: 0.15, distance: 1.08, speed: 0.0000003502, texture: 'textures/venus.jpg', rotationSpeed: 0.004 },
  { name: 'Earth', size: 0.17, distance: 1.5, speed: 0.0000002978, texture: 'textures/earth.jpg', rotationSpeed: 0.01 },
  { name: 'Mars', size: 0.125, distance: 2.28, speed: 0.00000024077, texture: 'textures/mars.jpg', rotationSpeed: 0.008 },
  { name: 'Jupiter', size: 0.35, distance: 7.78, speed: 0.0000001307, texture: 'textures/jupiter.jpg', rotationSpeed: 0.02 },
  { name: 'Saturn', size: 0.3, distance: 14.3, speed: 0.0000000969, texture: 'textures/saturn.jpg', rotationSpeed: 0.018 },
  { name: 'Uranus', size: 0.25, distance: 28.8, speed: 0.0000000681, texture: 'textures/uranus.jpg', rotationSpeed: 0.014 },
  { name: 'Neptune', size: 0.225, distance: 45, speed: 0.0000000543, texture: 'textures/neptune.jpg', rotationSpeed: 0.012 },
];

let planets = [];
let earth;
let useRealData = false;
let globalSpeedMultiplier = 1; 
let realScaleFactor = 0.2;

// Function to initialize planets
function initPlanets(data, scaleFactor) {
  planets.forEach(({ orbit }) => scene.remove(orbit));
  planets = [];

  planets = data.map(({ name, size, distance, speed, texture, rotationSpeed, inclinationX, inclinationZ }) => {
    const { orbit, planet, speed: planetSpeed, orbitPath, rotationSpeed: planetRotationSpeed } = createPlanet(
      size * scaleFactor, texture, distance, speed, rotationSpeed, inclinationX || 0, inclinationZ || 0
    );
    scene.add(orbit);
    if (name === 'Earth') earth = planet;
    return { name, orbit, planet, speed: planetSpeed, orbitPath, rotationSpeed: planetRotationSpeed };
  });

  sun.scale.set(scaleFactor, scaleFactor, scaleFactor);
  camera.position.set(0, 5, 20);
  controls.target.set(0, 0, 0);
  controls.update();

  // Show the information panel in default and real solar system views
  if (!focusOnEarth) {
    populatePlanetInfoPanel();
    document.getElementById('planetInfoPanel').style.display = 'block';
  } else {
    document.getElementById('planetInfoPanel').style.display = 'none';
  }
}

initPlanets(planetsData, 1);

// Function to populate the planet info panel
function populatePlanetInfoPanel() {
  const planetInfoPanel = document.getElementById('planetInfoPanel');
  planetInfoPanel.innerHTML = ''; 

  planetsData.forEach(planet => {
    const infoBlock = document.createElement('div');
    infoBlock.className = 'planet-info-block';
    infoBlock.innerHTML = `
      <img src="${planet.texture}" alt="${planet.name}" class="planet-image">
      <div class="planet-name">${planet.name}</div>
      <div class="planet-details">
        Speed: ${planet.realSpeed}<br>
        Size: ${planet.realSize}<br>
        Description: ${planet.text}.
      </div>
    `;
    planetInfoPanel.appendChild(infoBlock);
  });
}

// Create a planet with texture and inclined orbit path
function createPlanet(size, textureUrl, distance, speed, rotationSpeed, inclinationX, inclinationZ) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    map: textureLoader.load(textureUrl, undefined, undefined, () => {
      console.error(`Failed to load texture: ${textureUrl}`);
    }),
    roughness: 1,
    metalness: 0,
  });

  const planet = new THREE.Mesh(geometry, material);
  const orbitGeometry = new THREE.RingGeometry(distance - 0.01, distance + 0.01, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const orbitPath = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbitPath.rotation.x = THREE.MathUtils.degToRad(90 + inclinationX);
  orbitPath.rotation.z = THREE.MathUtils.degToRad(inclinationZ);
  const orbit = new THREE.Object3D();
  orbit.add(planet);
  orbit.add(orbitPath);
  planet.position.x = distance;
  return { orbit, planet, speed, orbitPath, rotationSpeed };
}

var NEOData = [];
// Declare these globally so your animate() function can access them
let orbits = [];
var NEOs = [];
let speedsOfNEOs = [];  // Store speeds for each NEO

function createNEOs(){
  // Create orbit points
  var f = 1.5;
  // Ellipse and orbit parameters
  var a = 5;  // Semi-major axis
  var e = 0.5; // Eccentricity (between 0 and 1)
  var b = a * Math.sqrt(1 - e * e); // Semi-minor axis
  var inclination = THREE.MathUtils.degToRad(30); // Inclination angle in degrees, converted to radians
  var numPoints = 100;

  NEOData.forEach((object) => {
    a = object.a * f;
    e = object.e * f;
    b= Math.sqrt(a*a - e*e);
    inclination = THREE.MathUtils.degToRad(object.i);

    var speed = (4 * a * Math.pow(Math.PI / 2, b / a)) / object.per * f * 30;  // Speed from NEOData
    //var speed = 5;
    console.log('gbdwiq',speed);
    // Create orbit points in the xy-plane first (before applying inclination)
    
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const x = a * Math.cos(theta);   // Parametric x
      const z = b * Math.sin(theta);   // Parametric z
      points.push(new THREE.Vector3(x, 0, z)); // No y-component yet
    }

    // Rotate the points based on the inclination angle around the x-axis (to introduce tilt)
    const cosInclination = Math.cos(inclination);
    const sinInclination = Math.sin(inclination);

    points.forEach(point => {
      let zNew = point.z * cosInclination - point.y * sinInclination;
      let yNew = point.z * sinInclination + point.y * cosInclination;
      point.z = zNew;
      point.y = yNew;
    });

    orbits.push(points);
    // Store the speed for this NEO
    speedsOfNEOs.push(speed);

    // Create geometry and line for the ellipse
    const ellipseGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const ellipseMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const ellipseLine = new THREE.Line(ellipseGeometry, ellipseMaterial);
    ellipseLine.rotation.set(0,0,0);
    earth.add(ellipseLine);
    //earth.elipsLine.rotation.set(0,0,0);
    // Create a sphere (representing the NEO) at the initial position
    const sphereGeometry = new THREE.SphereGeometry((object.diameter / 2) / Math.pow(10, 1.8), 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Start the sphere at the first point of the orbit
    sphere.position.set(points[0].x, points[0].y, points[0].z);
    earth.add(sphere);
    
    // Store the sphere for animation purposes
    NEOs.push(sphere);

  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  planets.forEach(({ orbit, speed, planet, rotationSpeed }) => {
    if (!focusOnEarth || planet !== earth) { // Check if we are not focusing on Earth
      orbit.rotation.y += speed * globalSpeedMultiplier;
    }
    planet.rotation.y += rotationSpeed * globalSpeedMultiplier;
  });

  const currentTime = Date.now() * 0.001;
  NEOs.forEach((sphere, index) => {
      const points = orbits[index];
      const speed = speedsOfNEOs[index];
      const pointIndex = Math.floor((currentTime * speed) % points.length);
      const nextPoint = points[pointIndex];
      sphere.position.set(nextPoint.x, nextPoint.y, nextPoint.z);
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle switching data views
document.getElementById('switchData').addEventListener('click', () => {
  useRealData = !useRealData;
  const dataToUse = useRealData ? newData : planetsData;
  const scaleFactor = useRealData ? realScaleFactor : 1;
  initPlanets(dataToUse, scaleFactor);
  document.getElementById('switchData').textContent = useRealData ? 'Switch to Default Data' : 'Switch to Real Data';
  resetSunAndLight(); // Ensure the sun is added back when switching views
});

// Handle focusing on Earth
document.getElementById('focusEarth').addEventListener('click', () => {
  focusOnEarth = true;  // Set the focus on Earth flag
  scene.remove(sun);
  createNEOs();
  
  planets.forEach(({ planet, orbitPath, orbit }) => {
    planet.visible = planet === earth;
    orbit.visible = planet === earth;
    orbitPath.visible = false;
  });

  earth.scale.set(3, 3, 3);  // Make Earth bigger in focus mode
  camera.position.set(0, 0, 1);  // Move camera closer to Earth
  controls.target.copy(earth.position);
  controls.update();
  document.getElementById('controls').style.display = 'none';
  document.getElementById('planetInfoPanel').style.display = 'none';
  document.getElementById('backButton').style.display = 'block';
});

// Handle going back to the full solar system view
document.getElementById('backToSystem').addEventListener('click', () => {
  focusOnEarth = false;  // Unset the focus on Earth flag
  initPlanets(planetsData, 1);
  document.getElementById('controls').style.display = 'block';
  document.getElementById('planetInfoPanel').style.display = 'block';
  document.getElementById('backButton').style.display = 'none';
  resetSunAndLight(); // Ensure the sun is added back when returning to the default view
});

fetch('https://api-xrny.onrender.com/get-csv')
  .then((response) => response.json())  // Parse the response as JSON
  .then((data) => {
    NEOData.push(...data);  // Append the elements of the JSON array to NEOData
    console.log(NEOData);  // Logs the updated NEOData array
    console.log(NEOData.length);  // Logs the length of the array
    animate(); // OVO DODAJ OVDIJE DA IMAMO PODATKE KAD SE UCITAJU
  })
  .catch((error) => console.error('Error fetching data:', error));

// Zoom controls
const minZoom = 1;
const maxZoom = 50;

document.getElementById('zoomIn').addEventListener('click', () => {
  if (camera.position.z > minZoom) {
    camera.position.z -= 1;
    controls.update();
  }
});

document.getElementById('zoomOut').addEventListener('click', () => {
  if (camera.position.z < maxZoom) {
    camera.position.z += 1;
    controls.update();
  }
});

// Handle orbit path visibility toggle
let orbitsVisible = true;
document.getElementById('toggleOrbits').addEventListener('click', () => {
  orbitsVisible = !orbitsVisible;
  planets.forEach(({ orbitPath }) => {
    orbitPath.visible = orbitsVisible;
  });
  document.getElementById('toggleOrbits').textContent = orbitsVisible ? 'Hide Orbits' : 'Show Orbits';
});

// Handle planet speed adjustment via slider
document.getElementById('speedSlider').addEventListener('input', (event) => {
  globalSpeedMultiplier = event.target.value;
});

// Resize the canvas on window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Function to reset the sun and lighting when switching views
function resetSunAndLight() {
  if (!scene.children.includes(sun)) {
    createSun();
  }
  pointLight.position.set(0, 0, 0);
  pointLight.intensity = 1;
}
