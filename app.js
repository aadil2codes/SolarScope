const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#world'),
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Earth Setup
const geometry = new THREE.SphereGeometry(2, 64, 64);
const textureLoader = new THREE.TextureLoader();
// High-res Earth texture
const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.9,
});

const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Starting State: 25% peek at bottom
earth.scale.set(3.5, 3.5, 3.5);
earth.position.y = -6.8; 

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

camera.position.z = 10;

// GSAP Animation
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-2",
        start: "top bottom",
        end: "top top",
        scrub: 1.5
    }
});

tl.to(earth.position, {
    y: 0,
    x: 4.8,
    ease: "power2.inOut"
})
.to(earth.scale, {
    x: 1.1,
    y: 1.1,
    z: 1.1,
    ease: "power2.inOut"
}, 0);

function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.001; 
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();