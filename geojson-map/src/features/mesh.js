/**
 * 地图图层：加载云南省区划 GeoJSON，使用投影将经纬度转换为平面坐标，
 * 绘制多边形边界并为各区县添加中心点标注。
 */

import * as THREE from "three";
import { geoMercator } from "d3-geo";

const chinaMap = new THREE.Group();
const boundaryGroup = new THREE.Group(); // 仅存放边界线的分组，用于精确居中
// 地图整体作为一个 Group，便于整体平移到坐标原点

const mercator = geoMercator().center([105, 34]).translate([0, 0]).scale(2000);
// 配置墨卡托投影：以中国区域为中心，比例尺 2000

const POS_ICON_URL = new URL("../assets/images/pos.png", import.meta.url).href;
// 标注图标（src/assets）通过模块相对路径解析，兼容 dev/build

const loader = new THREE.FileLoader();
loader.load(
  "https://geo.datav.aliyun.com/areas_v3/bound/530000_full_district.json",
  function (data) {
    const geojson = JSON.parse(data);
    console.log(geojson);
    // 加载云南省（adcode: 530000）完整区县边界数据

    geojson.features.forEach((feature) => {
      const province = new THREE.Group();
      // 每个 feature（区县）作为一个单独的 Group

      if (feature.geometry.type === "Polygon") {
        const polygon = createPolygon(feature.geometry.coordinates);
        province.add(polygon);
      } else if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach((polygonCoords) => {
          const polygon = createPolygon(polygonCoords);
          province.add(polygon);
        });
      }

      boundaryGroup.add(province);
    });

    geojson.features.forEach((feature) => {
      const [x, y] = getFeatureCenterXY(feature); // 兼容无 center 的情况

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        POS_ICON_URL,
        (texture) => {
          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });
          const annotation = new THREE.Sprite(material);
          annotation.scale.setScalar(9);
          annotation.renderOrder = 10;
          annotation.position.set(x, -y, 0);
          annotation.name = "annotation" + (feature.properties?.name ?? String(feature.properties?.adcode ?? ""));
          chinaMap.add(annotation);
        },
        undefined,
        () => {
          const fallback = createDotTexture(20, "orange");
          const material = new THREE.SpriteMaterial({
            map: fallback,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });
          const annotation = new THREE.Sprite(material);
          annotation.scale.setScalar(9);
          annotation.renderOrder = 10;
          annotation.position.set(x, -y, 0);
          annotation.name = "annotation" + (feature.properties?.name ?? String(feature.properties?.adcode ?? ""));
          chinaMap.add(annotation);
        }
      );
    });
    // 将边界线分组加入地图根节点
    chinaMap.add(boundaryGroup);
    // 仅根据边界线计算中心，避免标注精灵影响居中
    const box = new THREE.Box3().setFromObject(boundaryGroup);
    const center = box.getCenter(new THREE.Vector3());
    chinaMap.position.set(-center.x, -center.y, -center.z);
    // 将地图整体平移，使其几何中心对齐坐标原点，方便交互与观察
  }
);

function createPolygon(coordinates) {
  const group = new THREE.Group();
  // 为一个区县生成多条边界线（每个 ring 为一条折线）

  coordinates.forEach((item) => {
    const bufferGeometry = new THREE.BufferGeometry();
    const vertices = [];
    item.forEach((point) => {
      const [x, y] = mercator(point);
      vertices.push(x, -y, 0);
    });
    const attribute = new THREE.Float32BufferAttribute(vertices, 3);
    bufferGeometry.setAttribute("position", attribute);
    bufferGeometry.computeBoundingBox();

    const lineMaterial = new THREE.LineBasicMaterial({
      color: "white",
    });
    const line = new THREE.Line(bufferGeometry, lineMaterial);
    group.add(line);
  });

  return group;
}

export default chinaMap;

function createDotTexture(size = 32, color = "orange") {
  // 使用 Canvas 生成一个圆点纹理，作为标注图标的兜底
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function getFeatureCenterXY(feature) {
  // 返回 feature 的中心点：
  // 1) 优先使用 properties.center
  // 2) 若没有，则对几何坐标投影后取平均值
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
        sumX += px; sumY += py; count++;
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
