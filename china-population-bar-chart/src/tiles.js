// 瓦片图层模块：
// - 提供天地图 WMTS 底图与标注层的加载（buildTiandituTiles）
// - 支持模板 URL 的 TMS/XYZ 加载（buildTemplateTiles）
// - initBaseLayers 统一读取环境变量创建底图组，并应用遮罩
import * as THREE from "three";
import { geoMercator } from "d3-geo";
import { getTdtToken, buildTileURLShard } from "./utils/tileAuth.js";
const mercator = geoMercator().center([105, 34]).translate([0, 0]).scale(3500);

// 纹理加载（带子域名重试）：
// - 传入多个候选 URL，逐个尝试，成功返回 Texture；全部失败返回 null
/**
 * 依次尝试加载多个纹理 URL，返回第一个成功的 Texture
 * @param {string[]} urls - 候选纹理地址（支持多子域名）
 * @returns {Promise<THREE.Texture|null>} 加载成功返回 Texture，否则返回 null
 */
function loadTextureWithFallback(urls) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  return new Promise((resolve) => {
    const tryLoad = (i) => {
      if (i >= urls.length) {
        resolve(null);
        return;
      }
      const url = urls[i];
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          resolve(tex);
        },
        undefined,
        (err) => {
          console.warn("tdt tile load failed", { url, i, err });
          tryLoad(i + 1);
        }
      );
    };
    tryLoad(0);
  });
}

// 天地图 WMTS：
// - layer 取值：'tdt-img'（影像）、'tdt-cva'（标注）、'tdt-ter'（地形）
// - 使用遮罩模板：材质设置 stencilFunc = Equal，stencilRef = 1
/**
 * 构建天地图 WMTS 瓦片组
 * @param {object} params
 * @param {THREE.Box3} [params.box] - 由 Three 物体包围盒得到的范围
 * @param {{minX:number,minY:number,maxX:number,maxY:number}} [params.bounds] - 投影坐标聚合边界
 * @param {number} params.zoom - 天地图缩放级别
 * @param {string} params.token - 天地图 TK
 * @param {"tdt-img"|"tdt-cva"|"tdt-ter"} params.layer - 图层类型
 * @param {number} [params.z=-12] - Z 位置
 * @param {number} [params.opacity=0.95] - 透明度
 * @returns {THREE.Group} 瓦片组
 */
function buildTiandituTiles({ box, bounds, zoom, token, layer, z = -12, opacity = 0.95 }) {
  const group = new THREE.Group();
  // 经纬度边界：优先使用 features 聚合得到的 bounds，其次使用绘制边界的包围盒 box
  const toLonLat = (x, y) => mercator.invert([x, y]);
  const toLonLatBox = (x, y) => mercator.invert([x, -y]);
  let lonMin, latMin, lonMax, latMax;
  if (bounds) {
    [lonMin, latMin] = toLonLat(bounds.minX, bounds.minY);
    [lonMax, latMax] = toLonLat(bounds.maxX, bounds.maxY);
    const pad = 0.08;
    lonMin -= pad; lonMax += pad; latMin -= pad; latMax += pad;
  } else if (box) {
    const [aLon, aLat] = toLonLatBox(box.min.x, box.min.y);
    const [bLon, bLat] = toLonLatBox(box.max.x, box.max.y);
    lonMin = Math.min(aLon, bLon);
    lonMax = Math.max(aLon, bLon);
    latMin = Math.min(aLat, bLat);
    latMax = Math.max(aLat, bLat);
    const pad = 0.08;
    lonMin -= pad; lonMax += pad; latMin -= pad; latMax += pad;
  } else {
    return group;
  }
  // 经纬度 → 瓦片行列号（WebMercator）
  const toTileXY = (lon, lat, z) => {
    const n = Math.pow(2, z);
    let x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    let y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    x = Math.max(0, Math.min(n - 1, x));
    y = Math.max(0, Math.min(n - 1, y));
    return { x, y };
  };
  // 瓦片边界经纬度：用于计算平面尺寸与摆放位置
  const tile2lon = (x, z) => (x / Math.pow(2, z)) * 360 - 180;
  const tile2lat = (y, z) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };
  let t1 = toTileXY(lonMin, latMax, zoom);
  let t2 = toTileXY(lonMax, latMin, zoom);
  let minTile = { x: Math.min(t1.x, t2.x), y: Math.min(t1.y, t2.y) };
  let maxTile = { x: Math.max(t1.x, t2.x), y: Math.max(t1.y, t2.y) };
  if (minTile.x > maxTile.x || minTile.y > maxTile.y) {
    if (box) {
      const [blLon, blLat] = toLonLatBox(box.min.x, box.min.y);
      const [trLon, trLat] = toLonLatBox(box.max.x, box.max.y);
      t1 = toTileXY(blLon, trLat, zoom);
      t2 = toTileXY(trLon, blLat, zoom);
      minTile = { x: Math.min(t1.x, t2.x), y: Math.min(t1.y, t2.y) };
      maxTile = { x: Math.max(t1.x, t2.x), y: Math.max(t1.y, t2.y) };
    }
  }
  // 范围日志：便于调试当前加载的瓦片行列号范围
  console.info("tdtTiles range", { layer, zoom, minTile, maxTile });
  for (let tx = minTile.x; tx <= maxTile.x; tx++) {
    for (let ty = minTile.y; ty <= maxTile.y; ty++) {
      const lonL = tile2lon(tx, zoom);
      const lonR = tile2lon(tx + 1, zoom);
      const latT = tile2lat(ty, zoom);
      const latB = tile2lat(ty + 1, zoom);
      const [xL, yT] = mercator([lonL, latT]);
      const [xR, yB] = mercator([lonR, latB]);
      const w = Math.abs(xR - xL);
      const h = Math.abs(yB - yT);
      const cx = (xL + xR) / 2;
      const cy = -((yT + yB) / 2);
      // 备选 URL：轮询 8 个子域名，提升稳定性
      let urls = [];
      let providerName = "";
      const isWMTS = layer === "tdt-img" || layer === "tdt-cva" || layer === "tdt-ter";
      if (isWMTS) {
        const provider = layer;
        for (let s = 0; s < 8; s++) {
          urls.push(buildTileURLShard(provider, zoom, ty, tx, token, s));
        }
        providerName = provider;
      } else {
        const mapped =
          layer === "img_w" ? "tdt-img" :
          layer === "cva_w" ? "tdt-cva" :
          layer === "ter_w" ? "tdt-ter" : "";
        if (mapped) {
          for (let s = 0; s < 8; s++) {
            urls.push(buildTileURLShard(mapped, zoom, ty, tx, token, s));
          }
          providerName = mapped;
        }
      }
      // 异步加载纹理并创建平面网格，材质开启模板测试实现裁剪
      loadTextureWithFallback(urls).then((tex) => {
        console.info("tdt tile loaded", { provider: providerName || layer, tx, ty, tex });
        if (!tex) return;
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: false,
          opacity,
          side: THREE.DoubleSide,
          depthTest: true,
          depthWrite: false,
          stencilWrite: true,
          stencilFunc: THREE.EqualStencilFunc,
          stencilRef: 1,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
        });
        const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        tileMesh.position.set(cx, cy, z);
        tileMesh.renderOrder = 2;
        group.add(tileMesh);
      });
    }
  }
  return group;
}

// 模板 URL 瓦片（TMS/XYZ）：
// - 支持 yFlip 切换行号方向
// - 与 WMTS 一样按遮罩模板进行裁剪
/**
 * 构建模板 URL 的瓦片组（TMS/XYZ）
 * @param {object} params
 * @param {THREE.Box3} [params.box]
 * @param {{minX:number,minY:number,maxX:number,maxY:number}} [params.bounds]
 * @param {number} params.zoom
 * @param {string} params.template - 模板 URL（{z}/{x}/{y}）
 * @param {boolean} [params.yFlip=false] - 是否翻转 y 行号（TMS）
 * @param {number} [params.z=-12]
 * @param {number} [params.opacity=0.95]
 * @returns {THREE.Group}
 */
function buildTemplateTiles({ box, bounds, zoom, template, yFlip = false, z = -12, opacity = 0.95 }) {
  const group = new THREE.Group();
  const toLonLat = (x, y) => mercator.invert([x, y]);
  const toLonLatBox = (x, y) => mercator.invert([x, -y]);
  let lonMin, latMin, lonMax, latMax;
  if (bounds) {
    [lonMin, latMin] = toLonLat(bounds.minX, bounds.minY);
    [lonMax, latMax] = toLonLat(bounds.maxX, bounds.maxY);
    const pad = 0.08;
    lonMin -= pad; lonMax += pad; latMin -= pad; latMax += pad;
  } else if (box) {
    const [aLon, aLat] = toLonLatBox(box.min.x, box.min.y);
    const [bLon, bLat] = toLonLatBox(box.max.x, box.max.y);
    lonMin = Math.min(aLon, bLon);
    lonMax = Math.max(aLon, bLon);
    latMin = Math.min(aLat, bLat);
    latMax = Math.max(aLat, bLat);
    const pad = 0.08;
    lonMin -= pad; lonMax += pad; latMin -= pad; latMax += pad;
  } else {
    return group;
  }
  const toTileXY = (lon, lat, z) => {
    const n = Math.pow(2, z);
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const yTop = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    const y = yFlip ? (n - 1 - yTop) : yTop;
    return { x, y };
  };
  const tile2lon = (x, z) => (x / Math.pow(2, z)) * 360 - 180;
  const tile2latTop = (y, z) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };
  const tile2lat = (y, z, flip) => {
    const n = Math.pow(2, z);
    const yTop = flip ? (n - 1 - y) : y;
    return tile2latTop(yTop, z);
  };
  let minTile = toTileXY(lonMin, latMax, zoom);
  let maxTile = toTileXY(lonMax, latMin, zoom);
  if (minTile.x > maxTile.x || minTile.y > maxTile.y) {
    if (box) {
      const [blLon, blLat] = toLonLatBox(box.min.x, box.min.y);
      const [trLon, trLat] = toLonLatBox(box.max.x, box.max.y);
      const a = toTileXY(blLon, trLat, zoom);
      const b = toTileXY(trLon, blLat, zoom);
      minTile = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) };
      maxTile = { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) };
    }
  }
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  for (let tx = minTile.x; tx <= maxTile.x; tx++) {
    for (let ty = minTile.y; ty <= maxTile.y; ty++) {
      const lonL = tile2lon(tx, zoom);
      const lonR = tile2lon(tx + 1, zoom);
      const latT = tile2lat(ty, zoom, yFlip);
      const latB = tile2lat(ty + 1, zoom, yFlip);
      const [xL, yT] = mercator([lonL, latT]);
      const [xR, yB] = mercator([lonR, latB]);
      const w = Math.abs(xR - xL);
      const h = Math.abs(yB - yT);
      const cx = (xL + xR) / 2;
      const cy = -((yT + yB) / 2);
      let url = template;
      url = url.replace("{z}", String(zoom)).replace("{x}", String(tx)).replace("{y}", String(ty));
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: false,
        opacity,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
        stencilWrite: true,
        stencilFunc: THREE.EqualStencilFunc,
        stencilRef: 1,
        stencilFail: THREE.KeepStencilOp,
        stencilZFail: THREE.KeepStencilOp,
        stencilZPass: THREE.KeepStencilOp,
      });
      const tileMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      tileMesh.position.set(cx, cy, z);
      tileMesh.renderOrder = 2;
      group.add(tileMesh);
    }
  }
  return group;
}

export function initBaseLayers({ box, bounds }) {
  const env = import.meta && import.meta.env ? import.meta.env : {};
  const group = new THREE.Group();
  // 配置项读取：
  // - TDT_TOKEN：天地图 TK（环境变量或 URL 查询或 localStorage）
  // - TDT_LAYER：底图图层（默认影像）
  // - TDT_ZOOM：天地图缩放级别
  // - TDT_LABEL_LAYER：标注图层
  // - ENABLE_TDT_LABEL：是否启用标注
  /**
   * 根据环境变量初始化底图图层组
   * @param {object} params
   * @param {THREE.Box3} [params.box]
   * @param {{minX:number,minY:number,maxX:number,maxY:number}} [params.bounds]
   * @returns {THREE.Group}
   */
  const TDT_TOKEN = env.VITE_TDT_TOKEN || env.VITE_TDT_TK || getTdtToken() || "";
  let TDT_LAYER = env.VITE_TDT_LAYER || "tdt-img";
  const TDT_ZOOM = Number(env.VITE_TDT_ZOOM || 9);
  let TDT_LABEL_LAYER = env.VITE_TDT_LABEL_LAYER || "";
  const ENABLE_TDT_LABEL = String(env.VITE_ENABLE_TDT_LABEL || "").toLowerCase() === "true";
  const normalize = (l) => {
    if (!l) return l;
    if (l === "img_w") return "tdt-img";
    if (l === "cva_w") return "tdt-cva";
    if (l === "ter_w") return "tdt-ter";
    return l;
  };
  TDT_LAYER = normalize(TDT_LAYER);
  TDT_LABEL_LAYER = normalize(TDT_LABEL_LAYER);
  console.info("initBaseLayers: tdt", { hasToken: !!TDT_TOKEN, layer: TDT_LAYER, zoom: TDT_ZOOM, label: TDT_LABEL_LAYER });
  if (TDT_TOKEN) {
    if (!TDT_LAYER) TDT_LAYER = "tdt-img";
    const tdtGroup = buildTiandituTiles({
      box,
      bounds,
      zoom: TDT_ZOOM,
      token: TDT_TOKEN,
      layer: TDT_LAYER,
      z: -12,
      opacity: 0.95,
    });
    group.add(tdtGroup);
    if (TDT_LABEL_LAYER && ENABLE_TDT_LABEL) {
      const labelGroup = buildTiandituTiles({
        box,
        bounds,
        zoom: TDT_ZOOM,
        token: TDT_TOKEN,
        layer: TDT_LABEL_LAYER,
        z: -11.5,
        opacity: 1.0,
      });
      group.add(labelGroup);
    }
  }
  const TMS_TEMPLATE = env.VITE_TMS_URL || "";
  const TMS_OVERLAY_TEMPLATE = env.VITE_TMS_OVERLAY_URL || "";
  const TMS_ZOOM = Number(env.VITE_TMS_ZOOM || env.VITE_TMS_START_LEVEL || 9);
  const TMS_Y_FLIP = String(env.VITE_TMS_TMS || "").toLowerCase() === "true";
  if (TMS_TEMPLATE) {
    const baseTiles = buildTemplateTiles({
      box,
      bounds,
      zoom: TMS_ZOOM,
      template: TMS_TEMPLATE,
      yFlip: TMS_Y_FLIP,
      z: -12.2,
      opacity: 0.95,
    });
    group.add(baseTiles);
  }
  if (TMS_OVERLAY_TEMPLATE) {
    const overlayTiles = buildTemplateTiles({
      box,
      bounds,
      zoom: TMS_ZOOM,
      template: TMS_OVERLAY_TEMPLATE,
      yFlip: TMS_Y_FLIP,
      z: -11.4,
      opacity: 1.0,
    });
    group.add(overlayTiles);
  }
  return group;
}
