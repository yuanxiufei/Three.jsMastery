import * as THREE from 'three';


// 创建 BufferGeometry 几何体
const geometry = new THREE.BufferGeometry();

// 定义顶点数据
const vertices = new Float32Array([
    0,0,0,
    100,0,0,
    0,100,0,

    // 0,100,0,
    // 100,0,0,
    100,100,0
]);

// 创建 BufferAttribute 属性
const attribute = new THREE.BufferAttribute(vertices, 3);
// 将属性添加到几何体中
geometry.attributes.position = attribute;



// 定义材质是 MeshBasicMaterial，这个不受灯光影响，设置个颜色。
const material = new THREE.MeshBasicMaterial({ color: new THREE.Color('orange'), wireframe: true });


// 定义索引数据
const indexes = new Uint16Array([
    0, 1,2,2,1,3
]);
// 将索引属性添加到几何体中
geometry.index = new THREE.BufferAttribute(indexes, 1);



// 创建 Mesh 网格
const mesh = new THREE.Mesh(geometry, material);
// 将网格添加到场景中
export default mesh;
