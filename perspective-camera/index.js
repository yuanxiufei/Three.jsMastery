// 引入Three.js库
import * as THREE from 'three';
// 引入轨道控制器
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// 添加场景
const  scene = new THREE.Scene();

// 添加坐标轴辅助
// const axesHelper = new THREE.AxesHelper(200); // 坐标轴辅助（红 X、绿 Y、蓝 Z），长度 200
// scene.add(axesHelper);

const width = window.innerWidth;
const height = window.innerHeight;

// 添加相机
const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
// 设置相机位置
camera.position.set(2000, 200, 200);
// 相机指向场景中心
camera.lookAt(0, 0, 0);

// 添加第二个相机, 相机参数(fov, aspect, near, far)
// 第一个参数是角度，第二个参数是宽高比，第三个是近裁截面的距离，第四个参数是远裁截面的距离
const camera2 = new THREE.PerspectiveCamera(20, 16/19, 100 ,300);
// CameraHelper 相机辅助
const cameraHelper = new THREE.CameraHelper(camera2);
// 相机辅助添加到场景中
scene.add(cameraHelper);


// 相机参数(fov, aspect, near, far)
const gui = new GUI();


const cameraFolder = gui.addFolder('相机参数');
// 监听相机参数变化
const onChange = () => {
   camera2.updateProjectionMatrix();
   cameraHelper.update();
}
// fov 视野角度
cameraFolder.add(camera2, 'fov', 1, 100).onChange(onChange);
// aspect 宽高比
cameraFolder.add(camera2, 'aspect', {
    '16/19': 16/19,
    '4/3': 4/3,
}).onChange(onChange);
// near 近裁截面的距离
cameraFolder.add(camera2, 'near', 0, 300).onChange(onChange);
// far 远裁截面的距离
cameraFolder.add(camera2, 'far', 300, 800).onChange(onChange);


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
