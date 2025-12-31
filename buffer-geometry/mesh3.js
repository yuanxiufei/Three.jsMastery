import * as THREE from 'three';

// 定义立方体几何体
const geometry = new THREE.BoxGeometry(100, 100, 100);
// 定义材质是 MeshLambertMaterial，这个受灯光影响，设置个颜色。
const material = new THREE.MeshLambertMaterial(({
    color: new THREE.Color('orange'),
    wireframe: true
}));
// 创建 Mesh 网格
const mesh = new THREE.Mesh(geometry, material);

console.log(mesh);

export default mesh;
