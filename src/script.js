import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AudioListener, Audio, AudioLoader } from 'three';

/**
 * Base
 */
// Debug
const gui = new GUI({
    width: 400
});

gui.close();
gui.hide();

if (window.location.hash === '#debug') {
    gui.show();
}

const debugObject = {};

const loadingBarBackground = document.querySelector('.loading-background');
const loadingBarElement = document.querySelector('.loading-bar');
const percentage = document.querySelector('.percentage');

let sceneReady = false;
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        window.setTimeout(() => {
            loadingBarBackground.classList.add('ended');
            loadingBarBackground.style.transform = '';
            loadingBarElement.classList.add('ended');
            percentage.classList.add('ended');
            loadingBarElement.style.transform = '';
            percentage.style.transform = '';
            window.setTimeout(() => {
                loadingBarBackground.remove();
                loadingBarElement.remove();
                percentage.remove();
            }, 5000);
        }, 500);
        window.setTimeout(() => {
            sceneReady = true;
        }, 3500);
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBarElement.style.transform = `scaleX(${progressRatio})`;
        percentage.innerText = (progressRatio * 100).toFixed(0) + ' %';
    }
);

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);


gltfLoader.load(
    'models/roomScene.gltf',
    (gltf) => {
        const loadedScene = gltf.scene;

        // Traverse the scene to find the object named 'boombox'
        loadedScene.traverse((child) => {
            
        });

        // Add the loaded scene to the main scene
        scene.add(loadedScene);
    }
);

/**
 * Sunlight (Directional Light)
 */
const sunlight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
sunlight.position.set(5, 10, 7); // Set position of the light
sunlight.castShadow = true; // Optional: enable shadow casting

// Add light to scene
scene.add(sunlight);

// Optional: Add sunlight controls to GUI
const lightFolder = gui.addFolder('Sunlight');
lightFolder.add(sunlight.position, 'x', -10, 10, 0.1).name('Position X');
lightFolder.add(sunlight.position, 'y', -10, 10, 0.1).name('Position Y');
lightFolder.add(sunlight.position, 'z', -10, 10, 0.1).name('Position Z');
lightFolder.add(sunlight, 'intensity', 0, 2, 0.01).name('Intensity');
lightFolder.open();




/**
 * POI
 */
const points = [
    {
        position: new THREE.Vector3(8, 7, 7),
        element: document.querySelector('.point-0')
    },
    {
        position: new THREE.Vector3(-8, 6, -5),
        element: document.querySelector('.point-1')
    },
    {
        position: new THREE.Vector3(4, 6, -5),
        element: document.querySelector('.point-2')
    }
];

debugObject.poi = true;
gui.add(debugObject, 'poi').onChange((val) => {
    for (const point of points) {
        if (!val) {
            point.element.classList.remove('visible');
        } else {
            point.element.classList.add('visible');
        }
    }
}).name('Points of Interest');



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 5, 4);
scene.add(camera);

/**
 * Camera Debug GUI
 */
const cameraFolder = gui.addFolder('Camera');

cameraFolder.add(camera.position, 'x', -10, 10, 0.1).name('Position X');
cameraFolder.add(camera.position, 'y', -10, 10, 0.1).name('Position Y');
cameraFolder.add(camera.position, 'z', -10, 10, 0.1).name('Position Z');

cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotation X');
cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotation Y');
cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotation Z');

cameraFolder.add(camera, 'fov', 10, 100, 1).name('Field of View').onChange(() => {
    camera.updateProjectionMatrix();
});

cameraFolder.add(camera, 'near', 0.01, 10, 0.01).name('Near Clipping Plane').onChange(() => {
    camera.updateProjectionMatrix();
});

cameraFolder.add(camera, 'far', 10, 200, 1).name('Far Clipping Plane').onChange(() => {
    camera.updateProjectionMatrix();
});

cameraFolder.open(); // Optional: Open the camera folder by default

/**
 * Audio Setup
 */
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('audio/lofi.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});

const volumeControl = {
    volume: sound.getVolume() // Initialize with current volume
};

// Add volume control to the GUI

const songs = {
    'Lo-Fi': 'lofi.mp3',
    'Chill': 'chill.mp3',
    'Classical': 'classical.mp3'
};

const audioFolder = gui.addFolder('Audio Controls');
audioFolder.add(volumeControl, 'volume', 0, 1, 0.01).name('Global Volume').onChange((value) => {
    sound.setVolume(value);
});
audioFolder.add(debugObject, 'currentSong', Object.keys(songs)).name('Select Song').onChange((selectedSong) => {
    // Load and play the selected song
    loadSong(songs[selectedSong]);
});
audioFolder.open();




// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([boombox]);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        if (intersectedObject === boombox) {
            boombox.material.color.set(0x00ff00); // Change color to green
            console.log('Boombox clicked!');
        }
    }
});

const clock = new THREE.Clock();
const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);

    for(const point of points)
        {
            const screenPosition = point.position.clone()
            screenPosition.project(camera)
    
            const translateX = screenPosition.x * sizes.width * 0.5
            const translateY = - screenPosition.y * sizes.height * 0.5
            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
        }
};

tick();
