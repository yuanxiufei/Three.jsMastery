import * as THREE from 'three'; // 引入 three.js 库为命名空间 THREE
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
const scene = new THREE.Scene(); // 创建场景对象

{ // 网格对象作用域开始
    const geometry = new THREE.BoxGeometry(100, 100, 100); // 创建立方体几何体，尺寸 100×100×100
    const material = new THREE.MeshLambertMaterial(({ // 创建 Lambert 漫反射材质
        color: new THREE.Color('red') // 设置材质颜色为橙色
    })); // 完成材质配置并实例化
    const mesh = new THREE.Mesh(geometry, material); // 用几何体与材质创建网格对象
    mesh.position.set(0, 0, 0); // 将网格位置设置为世界原点
    scene.add(mesh); // 把网格对象添加到场景
} // 网格对象作用域结束

{ // 点光源作用域开始
    const pointLight = new THREE.PointLight(0xffffff, 10000); // 创建白色点光源，强度 10000
    pointLight.position.set(80, 80, 80); // 设置点光源位置到 (80, 80, 80)
    scene.add(pointLight); // 将点光源添加到场景
} // 点光源作用域结束


{ // 坐标轴辅助器作用域开始
    const axesHelper = new THREE.AxesHelper(200); // 创建坐标轴辅助器，长度 100
    scene.add(axesHelper); // 将坐标轴辅助器添加到场景
} // 坐标轴辅助器作用域结束


{ // 相机与渲染器作用域开始
    const width = window.innerWidth; // 获取浏览器视口宽度
    const height = window.innerHeight; // 获取浏览器视口高度

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000); // 创建透视相机：视野 60°、近裁剪面 1、远裁剪面 1000
    camera.position.set(200, 200, 200); // 将相机放置到 (200, 200, 200)
    camera.lookAt(0, 0, 0); // 让相机朝向世界原点

    const renderer = new THREE.WebGLRenderer(); // 创建 WebGL 渲染器
    renderer.setSize(width, height) // 设置渲染尺寸为视口大小
    

    // 创建轨道控制器，绑定相机与渲染器
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼效果，使相机运动更加平滑
    controls.enableDamping = true;
    // 设置轨道控制器的目标点为世界原点
    controls.target.set(0, 0, 0);
    
    function render() {
        renderer.render(scene, camera); // 渲染一帧，将场景通过相机绘制到画布
        controls.update(); // 更新轨道控制器状态，确保相机与渲染器同步
        requestAnimationFrame(render); // 递归调用 render 函数，实现动画循环
    }
    
    render(); // 首次渲染场景

    document.body.append(renderer.domElement); // 将渲染器生成的 canvas 元素添加到页面
} // 相机与渲染器作用域结束
