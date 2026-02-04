import * as THREE from 'three';


// CylinderGeometry 参数详解（默认沿 Y 轴竖直）
// CylinderGeometry(
//   radiusTop,        // 顶部半径
//   radiusBottom,     // 底部半径（与顶部相等为圆柱；不等为圆台）
//   height,           // 高度（沿 Y 轴）
//   radialSegments=32,// 圆周分段数（越大越圆滑）
//   heightSegments=1, // 高度方向分段数（细分用）
//   openEnded=false,  // 是否去掉顶/底面（true 为空心管）
//   thetaStart=0,     // 起始角（弧度）
//   thetaLength=2π    // 覆盖角度（默认整圆）
// )
// 下行代码创建一个顶部/底部半径都为 50、高度为 80 的标准圆柱体
const geometry = new THREE.CylinderGeometry(50, 50, 80,5);

const material = new THREE.MeshBasicMaterial(({ // 基础材质（不受光照影响）
    color: new THREE.Color('orange'), // 橙色
    wireframe: true,                  // 线框模式，便于观察网格结构
}));

const mesh = new THREE.Mesh(geometry, material);

export default mesh;
