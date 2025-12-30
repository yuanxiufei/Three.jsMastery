// 瓦片辅助工具：
// - getFeatureBounds：计算单个要素在墨卡托投影下的边界
// - buildStencilMask：根据要素边界生成模板遮罩，用于裁剪瓦片
// - getAggBounds：聚合多个要素得到整体边界
// - getFeatureCenterXY：计算要素中心点（优先使用 properties.center）
import * as THREE from "three";

/**
 * 计算单个要素在墨卡托投影下的边界
 * @param {object} feature - GeoJSON Feature（Polygon/MultiPolygon）
 * @param {(lonlat:[number,number])=>[number,number]} mercator - d3-geo 投影函数
 * @returns {{minX:number,minY:number,maxX:number,maxY:number,width:number,height:number}}
 */
export function getFeatureBounds(feature, mercator) {
  // 遍历坐标 ring（含洞），投影后取 min/max
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const collect = (ring) => {
    ring.forEach((pt) => {
      const [x, y] = mercator(pt);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  };
  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach(collect);
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((poly) => poly.forEach(collect));
  }
  return { minX, minY, maxX, maxY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
}

/**
 * 基于要素边界生成模板遮罩
 * @param {object[]} features - GeoJSON Features 列表
 * @param {(lonlat:[number,number])=>[number,number]} mercator - d3-geo 投影函数
 * @returns {THREE.Group} 模板遮罩组（模板值=1）
 */
export function buildStencilMask(features, mercator) {
  // 以地图边界填充模板值 1，后续瓦片材质设置 Equal/Ref=1 进行裁剪
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilRef: 1,
    stencilZPass: THREE.ReplaceStencilOp,
  });
  features.forEach((feature) => {
    const polys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    polys.forEach((coords) => {
      const rings = [];
      coords.forEach((ring) => {
        const pts = [];
        ring.forEach((point) => {
          const [x, y] = mercator(point);
          pts.push(new THREE.Vector2(x, -y));
        });
        rings.push(pts);
      });
      if (rings.length) {
        // 首个 ring 为外轮廓，其余 ring 作为洞
        const shape = new THREE.Shape(rings[0]);
        for (let i = 1; i < rings.length; i++) shape.holes.push(new THREE.Path(rings[i]));
        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = -12;
        mesh.renderOrder = 0;
        group.add(mesh);
      }
    });
  });
  group.renderOrder = 0;
  return group;
}

/**
 * 聚合多个要素的边界范围
 * @param {object[]} features - GeoJSON Features 列表
 * @param {(lonlat:[number,number])=>[number,number]} mercator - d3-geo 投影函数
 * @returns {{minX:number,minY:number,maxX:number,maxY:number}} 聚合边界
 */
export function getAggBounds(features, mercator) {
  // 聚合所有要素边界的最小/最大值
  const agg = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  features.forEach((feature) => {
    const b = getFeatureBounds(feature, mercator);
    if (b.minX < agg.minX) agg.minX = b.minX;
    if (b.minY < agg.minY) agg.minY = b.minY;
    if (b.maxX > agg.maxX) agg.maxX = b.maxX;
    if (b.maxY > agg.maxY) agg.maxY = b.maxY;
  });
  return agg;
}

/**
 * 计算要素中心坐标（优先使用 properties.center；否则顶点平均）
 * @param {object} feature - GeoJSON Feature（Polygon/MultiPolygon）
 * @param {(lonlat:[number,number])=>[number,number]} mercator - d3-geo 投影函数
 * @returns {[number,number]} 墨卡托坐标系下的中心点 [x,y]
 */
export function getFeatureCenterXY(feature, mercator) {
  // 优先采用属性 center；否则取所有顶点平均值作为近似中心
  if (feature?.properties && Array.isArray(feature.properties.center)) {
    return mercator(feature.properties.center);
  }
  const coords = feature?.geometry?.coordinates;
  if (!coords) return [0, 0];
  let sumX = 0, sumY = 0, count = 0;
  const collect = (arr) => {
    arr.forEach((ring) => {
      ring.forEach((pt) => {
        const [px, py] = mercator(pt);
        sumX += px;
        sumY += py;
        count++;
      });
    });
  };
  if (feature.geometry.type === "Polygon") {
    collect(coords);
  } else if (feature.geometry.type === "MultiPolygon") {
    coords.forEach((poly) => collect(poly));
  }
  if (count === 0) return [0, 0];
  return [sumX / count, sumY / count];
}
