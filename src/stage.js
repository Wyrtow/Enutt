// Scene, lights, camera and a transparent shadow-catcher floor, tuned to the reference look.
import * as THREE from 'three';

export function createStage({ width = 1024, height = 1024, transparent = true, background = null, canvas } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, preserveDrawingBuffer: true, canvas });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (transparent) renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(24, width / height, 1, 2000);
  camera.position.set(0, 34, 175);
  camera.lookAt(0, 31, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcbbfae, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(45, 150, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 10; sc.far = 400;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.25; key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe6eeff, 0.7);
  fill.position.set(-90, 40, 60);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(0, 60, -120);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  return { renderer, scene, camera, key, fill, ground, render: () => renderer.render(scene, camera) };
}
