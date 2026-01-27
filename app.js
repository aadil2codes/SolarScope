const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#world"),
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;


const loader = new THREE.TextureLoader();

const dayTexture = loader.load(
    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg"
);

const nightTexture = loader.load(
    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/earthlights4k.jpg"
);

const cloudsTexture = loader.load(
    "https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png"
);

const geometry = new THREE.SphereGeometry(2, 64, 64);

const earthMaterial = new THREE.MeshStandardMaterial({
    map: dayTexture,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.0,
    roughness: 0.45,
    metalness: 0.0
});

const earth = new THREE.Mesh(geometry, earthMaterial);
scene.add(earth);

const cloudsMaterial = new THREE.MeshStandardMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
});

const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(2.01, 64, 64),
    cloudsMaterial
);

scene.add(clouds);


earth.scale.set(3.5, 3.5, 3.5);
earth.position.y = -6.8;

clouds.scale.copy(earth.scale);
clouds.position.copy(earth.position);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
sunLight.position.set(8, 4, 6);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x4466aa, 0.3);
rimLight.position.set(-8, 0, -6);
scene.add(rimLight);

camera.position.z = 10;


gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-2",
        start: "top bottom",
        end: "top top",
        scrub: 1.5
    }
});

tl.to([earth.position, clouds.position], {
    y: 0,
    x: 4.8,
    ease: "power2.inOut"
})
.to([earth.scale, clouds.scale], {
    x: 1.1,
    y: 1.1,
    z: 1.1,
    ease: "power2.inOut"
}, 0);

function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.0008;
    clouds.rotation.y += 0.0012;

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

gsap.to(".hero-content", {
    scrollTrigger: {
        trigger: ".section-1",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    opacity: 0,
    y: -80,
    ease: "power2.out"
});
