/**
 * 项目入口：组装场景、相机、渲染器与控制器，挂载到 #app，
 * 启动渲染循环并处理窗口尺寸自适应。
 */
import './style.css';
import * as THREE from 'three';
import mesh from './features/mesh.js'; // 示例网格对象
import { createScene } from './core/scene.js'; // 场景模块
import { createCamera, updateCameraOnResize } from './core/camera.js'; // 相机模块
import { createRenderer } from './core/renderer.js'; // 渲染器模块
import { createControls } from './core/controls.js'; // 控制器模块
import SpriteText from 'three-spritetext';

const app = document.getElementById('app');
// 获取页面中的渲染容器，所有 WebGL 画布都挂载到此元素

const scene = createScene();
scene.add(mesh);
// 创建场景并添加地图图层（mesh 为示例图层，实际为云南 GeoJSON）

const width = window.innerWidth;
const height = window.innerHeight;
// 初始视口尺寸，用于相机与渲染器的初始化

const camera = createCamera(width, height);
const renderer = createRenderer(width, height);
app.append(renderer.domElement);
// 创建相机与渲染器，并将渲染画布挂载到容器

const controls = createControls(camera, renderer);
// 创建轨道控制器，支持鼠标旋转、缩放、平移

function render() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
// 主动渲染循环：更新控制器（阻尼）并渲染一帧

render();
// 启动渲染循环

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateCameraOnResize(camera, w, h);
});
// 监听窗口尺寸变化：同步更新渲染器尺寸与相机投影

let lastPosName = null;
renderer.domElement.addEventListener('click', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  // 将屏幕坐标转换为标准设备坐标（NDC）

  const rayCaster = new THREE.Raycaster();
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  // 构建射线并从相机出发，用于拾取场景对象

  const intersections = rayCaster.intersectObjects(scene.children, true);
  // 与场景所有子对象（递归）进行相交测试

  if (intersections.length) {
    const hitSprite = intersections.find(i => i.object && i.object.isSprite);
    const obj = hitSprite ? hitSprite.object : intersections[0].object;

    if (obj.isSprite && typeof obj.name === 'string' && obj.name.startsWith('annotation')) {
      const text = obj.name.replace('annotation', '');
      const posName = new SpriteText(text, 2);
      posName.color = 'black';
      posName.backgroundColor = 'white';
      posName.padding = 0.4;
      posName.borderWidth = 0.08;
      posName.borderRadius = 0.6;
      posName.borderColor = 'orange';
      posName.position.set(0, 4, 1);
      if (posName.material) {
        posName.material.depthTest = false;
        posName.material.depthWrite = false;
      }
      posName.renderOrder = 20;
      obj.add(posName);

      if (lastPosName && lastPosName.parent) {
        lastPosName.parent.remove(lastPosName);
      }
      lastPosName = posName;
    }
  }
});
