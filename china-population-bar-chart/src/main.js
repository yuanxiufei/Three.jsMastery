// 应用入口：初始化 Three.js 场景、相机、渲染器和交互控制，并挂载地图与柱状图
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import mesh from './mesh.js';
const envFlags = import.meta && import.meta.env ? import.meta.env : {};
const SHOW_DECOR = String(envFlags.VITE_SHOW_DECOR || "true").toLowerCase() === "true";
const DECOR_COUNT = Number(envFlags.VITE_DECOR_COUNT || 10);
const DECOR_RADIUS_START = Number(envFlags.VITE_DECOR_RADIUS_START || 100);
const DECOR_RADIUS_STEP = Number(envFlags.VITE_DECOR_RADIUS_STEP || 50);
const DECOR_OPACITY_START = Number(envFlags.VITE_DECOR_OPACITY_START || 0.8);
const DECOR_OPACITY_STEP = Number(envFlags.VITE_DECOR_OPACITY_STEP || 0.05);
const DECOR_Y = Number(envFlags.VITE_DECOR_Y || -12.6);
const SHOW_PULSE = String(envFlags.VITE_SHOW_PULSE || "true").toLowerCase() === "true";
const PULSE_COLOR = String(envFlags.VITE_PULSE_COLOR || "#00ffff");
const PULSE_OPACITY = Number(envFlags.VITE_PULSE_OPACITY || 0.65);
const PULSE_SPEED = Number(envFlags.VITE_PULSE_SPEED || 0.7);
const PULSE_COUNT = Number(envFlags.VITE_PULSE_COUNT || 3);
const PULSE_MIN_R = Number(envFlags.VITE_PULSE_MIN_R || DECOR_RADIUS_START);
const PULSE_MAX_R = Number(envFlags.VITE_PULSE_MAX_R || (DECOR_RADIUS_START + DECOR_RADIUS_STEP * DECOR_COUNT));
const PULSE_THICKNESS = Number(envFlags.VITE_PULSE_THICKNESS || 14);
let pulseUniforms = [];
const SHOW_SCAN_OVERLAY = String(envFlags.VITE_SHOW_SCAN_OVERLAY || "true").toLowerCase() === "true";
const SCAN_COLOR = String(envFlags.VITE_SCAN_COLOR || "#00ffff");
const SCAN_OPACITY = Number(envFlags.VITE_SCAN_OPACITY || 0.18);
const SCAN_SPEED = Number(envFlags.VITE_SCAN_SPEED || 0.6);
const SCAN_THICKNESS = Number(envFlags.VITE_SCAN_THICKNESS || 0.08);
const SCAN_RINGS = Number(envFlags.VITE_SCAN_RINGS || 6.0);
const SCAN_DASHES = Number(envFlags.VITE_SCAN_DASHES || 48.0);
let scanUniforms = null;

const app = document.getElementById('app');

const scene = new THREE.Scene();
// 将地图主体（包含边界、柱状图与标签）添加到场景
scene.add(mesh);

// 主光源：用于给几何体提供基本照明
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(500, 300, 600);
scene.add(light);

// 环境光：填充阴影区域的整体亮度
const light2 = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(light2);
const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.35);
scene.add(hemi);

// 网格背景平面（public/grid.png）：放置在地图下方，低透明度
{
  const geometry = new THREE.PlaneGeometry(3000, 3000);
  const loader = new THREE.TextureLoader();
  const grid = loader.load('/grid.png');
  grid.colorSpace = THREE.SRGBColorSpace;
  grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
  grid.repeat.set(20, 20);
  const material = new THREE.MeshPhongMaterial({
    map: grid,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -11;
  scene.add(plane);
}

if (SHOW_SCAN_OVERLAY) {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  scanUniforms = {
    time: { value: 0 },
    color: { value: new THREE.Color(SCAN_COLOR) },
    opacity: { value: SCAN_OPACITY },
    speed: { value: SCAN_SPEED },
    thickness: { value: SCAN_THICKNESS },
    rings: { value: SCAN_RINGS },
    dashes: { value: SCAN_DASHES },
  };
  const vtx = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `;
  const frg = `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float speed;
    uniform float thickness;
    uniform float rings;
    uniform float dashes;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p);
      float a = atan(p.y, p.x);
      float angle01 = (a + 3.1415926) / (2.0 * 3.1415926);
      float dash = step(0.96, fract(angle01 * dashes));
      float sweep = fract(r * rings - time * speed);
      float ring = smoothstep(1.0 - thickness, 1.0, sweep) * (1.0 - r);
      float noise = hash(vUv * 100.0);
      float mask = clamp(ring + dash * 0.5 + noise * 0.08, 0.0, 1.0);
      gl_FragColor = vec4(color * mask, opacity * mask);
    }
  `;
  const mat = new THREE.ShaderMaterial({
    uniforms: scanUniforms,
    vertexShader: vtx,
    fragmentShader: frg,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    stencilWrite: true,
    stencilFunc: THREE.EqualStencilFunc,
    stencilRef: 1,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.y), mat);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = DECOR_Y + 0.05;
  plane.renderOrder = 2;
  scene.add(plane);
}
if (SHOW_PULSE) {
  pulseUniforms = [];
  for (let k = 0; k < PULSE_COUNT; k++) {
    const uniforms = {
      time: { value: 0 },
      color: { value: new THREE.Color(PULSE_COLOR) },
      opacity: { value: PULSE_OPACITY },
      speed: { value: PULSE_SPEED + k * 0.12 },
      minR: { value: PULSE_MIN_R },
      maxR: { value: PULSE_MAX_R },
      thickness: { value: PULSE_THICKNESS },
      phase: { value: k / PULSE_COUNT },
    };
    pulseUniforms.push(uniforms);
    const vtx = `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `;
    const frg = `
      varying vec2 vPos;
      uniform float time;
      uniform vec3 color;
      uniform float opacity;
      uniform float speed;
      uniform float minR;
      uniform float maxR;
      uniform float thickness;
      uniform float phase;
      void main() {
        float r = length(vPos);
        float t = fract(phase + time * speed);
        float R = mix(minR, maxR, t);
        float d = abs(r - R);
        float band = smoothstep(thickness, 0.0, d);
        float fall = smoothstep(maxR, minR, r);
        float alpha = opacity * band * fall;
        gl_FragColor = vec4(color, alpha);
      }
    `;
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vtx,
      fragmentShader: frg,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      stencilWrite: true,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilRef: 1,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PULSE_MAX_R * 2, PULSE_MAX_R * 2), mat);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = DECOR_Y + 0.02;
    plane.renderOrder = 1;
    scene.add(plane);
  }
}
if (SHOW_DECOR) {
  for (let i = 0; i < DECOR_COUNT; i++) {
    const R = DECOR_RADIUS_START + i * DECOR_RADIUS_STEP;
    const opacity = Math.max(0, DECOR_OPACITY_START - i * DECOR_OPACITY_STEP);
    if (i % 2 === 0) {
      const curve = new THREE.EllipseCurve(0, 0, R, R, 0, Math.PI * 2);
      const pointsArr = curve.getPoints(50);
      const geometry2 = new THREE.BufferGeometry();
      geometry2.setFromPoints(pointsArr);
      const material2 = new THREE.LineBasicMaterial({
        color: new THREE.Color("white"),
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false,
        stencilWrite: true,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilRef: 1,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      });
      const line = new THREE.Line(geometry2, material2);
      line.rotateX(-Math.PI / 2);
      line.position.y = DECOR_Y;
      line.renderOrder = 1;
      scene.add(line);
    } else {
      const geometry2 = new THREE.BufferGeometry();
      const pointsArr = [];
      const R2 = R - 10;
      for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 100) {
        pointsArr.push(
          new THREE.Vector3(R * Math.cos(angle), R * Math.sin(angle), 0),
          new THREE.Vector3(R2 * Math.cos(angle), R2 * Math.sin(angle), 0),
        );
      }
      geometry2.setFromPoints(pointsArr);
      const material2 = new THREE.LineBasicMaterial({
        color: new THREE.Color("white"),
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false,
        stencilWrite: true,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilRef: 1,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      });
      const line = new THREE.LineSegments(geometry2, material2);
      line.rotateX(-Math.PI / 2);
      line.position.y = DECOR_Y;
      line.renderOrder = 1;
      scene.add(line);
    }
  }
}

// 坐标轴辅助线（便于调试观察坐标方向）
// const axesHelper = new THREE.AxesHelper(1000);
// scene.add(axesHelper);

const width = window.innerWidth;
const height = window.innerHeight;

// 透视相机：FOV 60，近裁剪 1，远裁剪 10000
const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
camera.position.set(0, 500, 200);
camera.lookAt(0, 0, 0);

// 抗锯齿渲染器，像素比做上限限制以兼顾清晰与性能
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.append(renderer.domElement);

// 轨道控制器：仅允许水平旋转，禁用平移，避免地图被翻到背面
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
const fixedPolar = controls.getPolarAngle();
controls.minPolarAngle = fixedPolar;
controls.maxPolarAngle = fixedPolar;
controls.enablePan = false;

// 动画渲染循环
function render() {
  controls.update();
  if (scanUniforms) scanUniforms.time.value = performance.now() / 1000;
  if (pulseUniforms && pulseUniforms.length) {
    const t = performance.now() / 1000;
    for (const u of pulseUniforms) u.time.value = t;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

// 视口尺寸自适应：更新渲染器与相机参数
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});
