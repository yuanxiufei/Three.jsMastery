import * as THREE from 'three';

// 定义平面几何体
const geometry = new THREE.PlaneGeometry(100, 100);
// 定义材质是 MeshBasicMaterial，这个不受灯光影响，设置个颜色。
const material = new THREE.MeshBasicMaterial(({
    color: new THREE.Color('orange')
}));
// 创建 Mesh 网格
const mesh = new THREE.Mesh(geometry, material);

console.log(mesh);

export default mesh;
