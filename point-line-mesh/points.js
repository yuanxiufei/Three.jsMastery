import * as THREE from 'three';
// 创建点几何体
const geometry = new THREE.BufferGeometry();

// 定义顶点位置
const vertices = new Float32Array([
    0,0,0,
    100,0,0,
    0,100,0,
    0,0,100,
    100,100,0
])

// 赋值顶点属性
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// 创建点材质
const material = new THREE.PointsMaterial({
    color: new THREE.Color('red'),
    size: 10
})
// 创建点对象
const points = new THREE.Points(geometry, material);


// 导出点对象
export default points;






