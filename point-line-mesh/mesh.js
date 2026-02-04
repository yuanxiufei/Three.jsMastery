import * as THREE from 'three'; // 导入 Three.js 核心库

const geometry = new THREE.BufferGeometry(); // 创建缓冲几何体实例

const vertices = new Float32Array([ // 顶点坐标数组（TypedArray），每 3 个数为一个顶点的 x/y/z
    0, 0, 0,       // 顶点 A：位于原点
    100, 0, 0,     // 顶点 B：X 方向 100
    0, 100, 0,     // 顶点 C：Y 方向 100
    100, 100, 0    // 顶点 D：X/Y 各 100
]); // 注意：单位默认是“世界坐标单位”，可按需缩放

const attribute = new THREE.BufferAttribute(vertices, 3); // 创建缓冲属性：itemSize=3，表示每个顶点有 3 个分量（x,y,z）
// 这里假设外部已有 BufferGeometry 实例 geometry（如：const geometry = new THREE.BufferGeometry()）
// 如果在本文件中使用，应先 new THREE.BufferGeometry() 后再设置 position 属性
geometry.attributes.position = attribute;

const index = new Uint16Array([ // 索引数组（TypedArray），每 3 个数为一个三角形的 3 个顶点索引
    // 0, 1, 2, // 第一个三角形：ABC
    // 2, 1, 3  // 第二个三角形：BDA
      0, 1, 2, // 第一个三角形：ABC
      2, 3, 1  // 第二个三角形：BDA
]); // 注意：索引从 0 开始，按顺时针或逆时针顺序定义三角形

// 设置索引属性
geometry.index = new THREE.BufferAttribute(index, 1); // 设置索引属性：itemSize=1，表示每个索引为 1 个分量（索引值）
  

// 定义材质是 MeshBasicMaterial，这个不受灯光影响，设置个颜色。
const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color('orange'),
    side: THREE.DoubleSide
});
// 创建 Mesh 网格
const mesh = new THREE.Mesh(geometry, material);

export default mesh;
