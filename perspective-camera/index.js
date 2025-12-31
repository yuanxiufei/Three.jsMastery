// 引入Three.js库
import * as THREE from 'three';
// 引入轨道控制器
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 添加场景
const  scene = new THREE.Scene();

// 添加坐标轴辅助
const axesHelper = new THREE.AxesHelper(200); // 坐标轴辅助（红 X、绿 Y、蓝 Z），长度 200
scene.add(axesHelper);

const width = window.innerWidth;
const height = window.innerHeight;

// 添加相机
const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
// 设置相机位置
camera.position.set(2000, 200, 200);
// 相机指向场景中心
camera.lookAt(0, 0, 0);

// 添加渲染器
const renderer = new THREE.WebGLRenderer();
// 设置渲染器大小
renderer.setSize(width, height);

// 循环渲染场景
function render() {
    // 渲染场景
    renderer.render(scene, camera);
    // 递归调用渲染函数
    requestAnimationFrame(render);
}

// 启动渲染循环
render();

// 添加渲染器到页面
document.body.append(renderer.domElement);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
