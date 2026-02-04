import * as THREE from 'three';

// PlaneGeometry 参数详解（默认位于 XY 平面，法线朝 +Z）
// PlaneGeometry(
//   width,            // 宽度（X 方向尺寸）
//   height,           // 高度（Y 方向尺寸）
//   widthSegments=1,  // 宽度方向分段数（网格细分，越大越密）
//   heightSegments=1  // 高度方向分段数（网格细分）
// )
// 下行代码创建一个宽 100、高 100 的平面，横向细分为 2、纵向细分为 3
const geometry = new THREE.PlaneGeometry(100, 100, 2, 3);

const material = new THREE.MeshBasicMaterial(({
    color: new THREE.Color('orange'),
    wireframe: true
}));

const mesh = new THREE.Mesh(geometry, material);

console.log(mesh);

export default mesh;
