// 地图与人口柱状图模块：加载云南省区县边界，生成柱状体与标签
import * as THREE from "three";
import { geoMercator } from "d3-geo";
import populationData from "./data.js";
import SpriteText from "three-spritetext";
import gsap from "gsap";
import { initBaseLayers } from "./tiles.js";
import { buildStencilMask, getAggBounds, getFeatureCenterXY } from "./utils/tile-utils.js";
const envFlags = import.meta && import.meta.env ? import.meta.env : {};
const SHOW_BOUNDARY = String(envFlags.VITE_SHOW_BOUNDARY || "true").toLowerCase() === "true";
const SHOW_NAMES = String(envFlags.VITE_SHOW_NAMES || "false").toLowerCase() === "true";
const chinaMap = new THREE.Group();
const boundaryGroup = new THREE.Group();
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_RATIO = 0.12;
const BAR_SIZE_RATIO = 0.006;
const LABEL_HEIGHT_RATIO = 0.02;

const mercator = geoMercator().center([105, 34]).translate([0, 0]).scale(3500);

// 加载区县 GeoJSON 数据
const loader = new THREE.FileLoader();
loader.load(
  "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=530000_full_district",
  function (data) {
    const geojson = JSON.parse(data);
    

    geojson.features.forEach((feature) => {
      const province = new THREE.Group();

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

    // 计算地图尺寸用于联动柱体与标签的比例
    const barsGroup = new THREE.Group();
    const mapBox = new THREE.Box3().setFromObject(boundaryGroup);
    const mapSize = mapBox.getSize(new THREE.Vector3());
    const mapExtent = Math.max(mapSize.x, mapSize.y) || 100;
    const dynamicMax = Math.max(mapExtent * BAR_MAX_RATIO, BAR_MIN_HEIGHT + 2);
    const values = [];
    geojson.features.forEach((feature) => {
      const name = feature?.properties?.name;
      const v =
        name && populationData[name] != null ? Number(populationData[name]) : 0;
      if (v > 0) values.push(v);
    });
    const maxValue = values.length ? Math.max(...values) : 1;
    const barSize = Math.max(2, mapExtent * BAR_SIZE_RATIO);
    const labelH = Math.max(2, mapExtent * LABEL_HEIGHT_RATIO);
    const labelW = labelH * 2;
    const nameTextSize = Math.max(0.4, mapExtent * 0.006);
    geojson.features.forEach((feature) => {
      const [x, y] = getFeatureCenterXY(feature, mercator);
      const name = feature?.properties?.name;
      const num =
        name && populationData[name] != null ? Number(populationData[name]) : 0;
      if (!num || num <= 0) return;
      const height = Math.max((num / maxValue) * dynamicMax, BAR_MIN_HEIGHT);
      const geo = new THREE.BoxGeometry(barSize, barSize, height);
      const positions = geo.attributes.position;
      const colorsArr = [];
      // 顶到底渐变颜色，可根据视觉风格调整
      const color1 = new THREE.Color("pink");
      const color2 = new THREE.Color("red");
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        const percent = Math.max(0, Math.min(1, (z + height / 2) / height));
        const c = color1.clone().lerp(color2, percent);
        colorsArr.push(c.r, c.g, c.b);
      }
      const colors = new Float32Array(colorsArr);
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(x, -y, -height / 2);
      const numLabel = createLabelSprite(`${num}万`, labelW, labelH);
      numLabel.position.set(0, 0, height / 2 + 2);
      bar.add(numLabel);
      // 弹跳动画：上升到目标顶面位置
      gsap.to(bar.position, {
        z: height / 2,
        ease: "bounce.out",
        duration: 2,
      });
      barsGroup.add(bar);
    });
    chinaMap.add(barsGroup);

    if (SHOW_BOUNDARY) {
      chinaMap.add(boundaryGroup);
    }
    const namesGroup = new THREE.Group();
    // 为每个区块添加中心名称（SpriteText，始终面向相机）
    geojson.features.forEach((feature) => {
      const nm = feature?.properties?.name || "";
      const [cx, cy] = getFeatureCenterXY(feature, mercator);
      const t = new SpriteText(nm, nameTextSize, "#eaeef2");
      t.textHeight = nameTextSize;
      t.strokeWidth = 0.5;
      t.strokeColor = "#1f2d3d";
      t.position.set(cx, -cy, 2);
      if (t.material) {
        t.material.depthTest = false;
      }
      namesGroup.add(t);
    });
    if (SHOW_NAMES) {
      chinaMap.add(namesGroup);
    }
    const aggBounds = getAggBounds(geojson.features, mercator);
    const maskGroup = buildStencilMask(geojson.features, mercator);
    chinaMap.add(maskGroup);
    const baseLayers = initBaseLayers({ bounds: aggBounds });
    if (baseLayers && baseLayers.children.length) {
      chinaMap.add(baseLayers);
    }
    const recenterBox = new THREE.Box3();
    if (typeof baseLayers !== "undefined" && baseLayers) {
      recenterBox.expandByObject(baseLayers);
    }
    if (SHOW_BOUNDARY) {
      recenterBox.expandByObject(boundaryGroup);
    }
    const center = recenterBox.getCenter(new THREE.Vector3());
    chinaMap.position.set(-center.x, -center.y, -center.z);
  }
);

/**
 * 将 GeoJSON ring 坐标绘制为边界线组（不填充面片）
 * @param {Array<Array<[number,number]>>} coordinates - Polygon 的坐标数组（含洞）
 * @returns {THREE.Group} 边界线组
 */
function createPolygon(coordinates) {
  const group = new THREE.Group();

  const rings = [];
  coordinates.forEach((ring) => {
    const bufferGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const pts = [];
    ring.forEach((point) => {
      const [x, y] = mercator(point);
      vertices.push(x, -y, 0);
      pts.push(new THREE.Vector2(x, -y));
    });
    rings.push(pts);
    const attribute = new THREE.Float32BufferAttribute(vertices, 3);
    bufferGeometry.setAttribute("position", attribute);
    bufferGeometry.computeBoundingBox();

    const lineMaterial = new THREE.LineBasicMaterial({ color: "white", depthTest: false });
    const line = new THREE.Line(bufferGeometry, lineMaterial);
    line.renderOrder = 3;
    group.add(line);
  });

  if (rings.length) {
    const shape = new THREE.Shape(rings[0]);
    for (let i = 1; i < rings.length; i++) shape.holes.push(new THREE.Path(rings[i]));
    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 2,
      bevelEnabled: false,
      steps: 1,
    });
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x2c3e50),
      transparent: true,
      opacity: 0.18,
      shininess: 20,
      depthTest: true,
    });
    const mesh = new THREE.Mesh(extrude, mat);
    mesh.position.z = -2;
    mesh.renderOrder = 2;
    group.add(mesh);
  }

  return group;
}

// 将整张地图绕 X 轴旋转，使 Z 轴作为“高度”方向
chinaMap.rotateX(-Math.PI / 2);

export default chinaMap;


/**
 * 创建数值标签精灵（Sprite）
 * - 用 Canvas 绘制 1:2 的圆角矩形并生成贴图
 * @param {string} text - 文本内容
 * @param {number} worldWidth - 精灵在世界坐标中的宽度
 * @param {number} worldHeight - 精灵在世界坐标中的高度
 * @returns {THREE.Sprite} 标签精灵
 */
function createLabelSprite(text, worldWidth, worldHeight) {
  const canvasWidth = 256;
  const canvasHeight = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const radius = 16;
  const padX = 18;
  const padY = 12;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "#1f2d3d";
  ctx.lineWidth = 6;
  roundRect(ctx, padX, padY, canvasWidth - padX * 2, canvasHeight - padY * 2, radius, true, true);
  ctx.fillStyle = "#1f2d3d";
  ctx.font = "bold 64px Microsoft YaHei, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(worldWidth, worldHeight, 1);
  return sprite;
}

/**
 * 在 Canvas 上绘制圆角矩形
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number|{tl:number,tr:number,br:number,bl:number}} r
 * @param {boolean} fill
 * @param {boolean} stroke
 */
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}


