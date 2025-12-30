// 应用入口：初始化 Three.js 场景、相机、渲染器和交互控制，并挂载地图与柱状图
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import mesh from './mesh.js';
const envFlags = import.meta && import.meta.env ? import.meta.env : {};
const SHOW_DECOR = String(envFlags.VITE_SHOW_DECOR || "true").toLowerCase() === "true";

const app = document.getElementById('app');

const scene = new THREE.Scene();
// 将地图主体（包含边界、柱状图与标签）添加到场景
scene.add(mesh);

// 主光源：用于给几何体提供基本照明
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(500, 300, 600);
scene.add(light);

// 环境光：填充阴影区域的整体亮度
const light2 = new THREE.AmbientLight(0xffffff, 1);
scene.add(light2);

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

if (SHOW_DECOR) {
  for (let i = 0; i < 10; i++) {
    const R = 100 + i * 50;
    const opacity = Math.max(0, 0.8 - i * 0.05);
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
        stencilWrite: true,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilRef: 1,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      });
      const line = new THREE.Line(geometry2, material2);
      line.rotateX(-Math.PI / 2);
      line.position.y = -11;
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
        stencilWrite: true,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilRef: 1,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      });
      const line = new THREE.LineSegments(geometry2, material2);
      line.rotateX(-Math.PI / 2);
      line.position.y = -11;
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
