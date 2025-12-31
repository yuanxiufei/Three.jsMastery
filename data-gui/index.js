import * as THREE from 'three'; // 导入 Three.js 核心库
import { // 使用解构导入的语法开始
    OrbitControls // 轨道控制器：支持鼠标旋转、缩放、平移
} from 'three/addons/controls/OrbitControls.js'; // 指定三方扩展模块路径
import GUI from 'lil-gui'; // 导入 lil-gui 调试面板

const scene = new THREE.Scene(); // 创建场景（承载所有物体与光源）

const geometry = new THREE.BoxGeometry(100, 100, 100); // 立方体几何体：宽、高、深均为 100
const material = new THREE.MeshLambertMaterial(({ // 漫反射材质（需要光照才能显色）
    color: new THREE.Color('orange') // 材质颜色：橙色
})); // 结束材质配置
const mesh = new THREE.Mesh(geometry, material); // 用几何体 + 材质创建网格模型
mesh.position.set(0, 0, 0); // 设置网格位置到场景原点
scene.add(mesh); // 将网格添加进场景


const gui = new GUI(); // 创建 GUI 面板


// 添加网格文件夹
const meshFolder = gui.addFolder('网格位置');
// 添加网格位置控制
meshFolder.add(mesh.position, 'x', -200, 200).step(10); // 控制网格 x 坐标，范围 [-200,200]、步长 10
meshFolder.add(mesh.position, 'y', -200, 200).step(10); // 控制网格 y 坐标
meshFolder.add(mesh.position, 'z', -200, 200).step(10); // 控制网格 z 坐标

// 添加颜色选择器并增加文件夹
const meshColorFolder = meshFolder.addFolder('颜色控制');
meshColorFolder.addColor(mesh.material, 'color'); // 添加颜色选择器，直接修改材质颜色



// 添加点光源
const pointLight = new THREE.PointLight(0xffffff, 10000); // 点光源：白色，强度 10000
pointLight.position.set(80, 80, 80); // 设置光源在空间中的位置
scene.add(pointLight); // 将光源添加进场景

// 添加点光源文件夹
const pointLightFolder = gui.addFolder('点光源位置');
// 点光源位置控制
pointLightFolder.add(pointLight.position, 'x').step(10); // 控制光源 x 坐标
pointLightFolder.add(pointLight.position, 'y').step(10); // 控制光源 y 坐标
pointLightFolder.add(pointLight.position, 'z').step(10); // 控制光源 z 坐标
pointLightFolder.add(pointLight, 'intensity').step(1000); // 控制光源强度（亮度）   

// 添加其他控制类型文件夹
const otherFolder = gui.addFolder('其他控制类型');
const obj = {
    aa:'天王盖地虎',
    bb: false,
    cc:'111',
    dd: 123,
    ff: 'aaa',
    logic: function(){
       alert('逻辑函数被调用');
    }
}
otherFolder.add(obj, 'aa'); // 添加字符串属性
otherFolder.add(obj, 'bb'); // 添加布尔属性
otherFolder.add(obj, 'cc'); // 添加数字属性
otherFolder.add(obj, 'ff'); // 添加字符串属性
otherFolder.add(obj, 'logic'); // 添加逻辑函数属性
otherFolder.add(obj,'dd').onChange((value)=>{
    console.log('dd属性被改变为：', value);
});



// 添加坐标轴辅助
const axesHelper = new THREE.AxesHelper(200); // 坐标轴辅助（红 X、绿 Y、蓝 Z），长度 200
scene.add(axesHelper); // 添加坐标轴到场景，便于观察方向

const width = window.innerWidth; // 视口宽度（像素）
const height = window.innerHeight; // 视口高度（像素）

const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000); // 透视相机：FOV=60，近裁剪=1，远裁剪=1000
camera.position.set(200, 200, 200); // 将相机放在斜上方位置
camera.lookAt(0, 0, 0); // 相机朝向场景原点

const renderer = new THREE.WebGLRenderer(); // 创建 WebGL 渲染器（负责把场景画到画布）
renderer.setSize(width, height) // 根据视口尺寸设置画布大小

function render() { // 帧循环函数：每帧渲染并预约下一帧
    renderer.render(scene, camera); // 用当前相机视角渲染场景
    requestAnimationFrame(render); // 请求浏览器在下一帧再次调用 render
}

render(); // 启动渲染循环

document.body.append(renderer.domElement); // 将渲染器的画布节点挂载到页面

const controls = new OrbitControls(camera, renderer.domElement); // 创建轨道控制器，绑定相机与画布
