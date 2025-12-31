# china-population-bar-chart 概览

本项目使用 Three.js + d3-geo 渲染云南省区县边界与人口柱状图，并结合模板缓冲（Stencil）实现底图裁剪与多种科技感动效（扫描覆盖层、脉冲圈、同心装饰线）。构建与开发基于 Vite，瓦片底图来源为天地图 WMTS（可选 TMS/XYZ 模板）。

## 目录结构

- public
  - grid.png：背景网格纹理
- scripts
  - gen-yunnan-data.mjs：数据生成辅助脚本
- src
  - utils
    - [tile-utils.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/tile-utils.js)：Stencil 遮罩与边界工具
    - [tileAuth.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/tileAuth.js)：天地图 TK 获取与子域名分片
    - [request.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/request.js)：Axios 请求封装（模板代码，当前入口未引用）
  - [main.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/main.js)：场景、相机、渲染器、控制器与动效
  - [mesh.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/mesh.js)：边界绘制、地图挤出、人口柱体与标签
  - [tiles.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/tiles.js)：天地图 WMTS/TMS 瓦片加载与裁剪
  - [data.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/data.js)：演示用人口数据
  - style.css、counter.js、javascript.svg：样式与示例资源
- [.env.example](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/.env.example)、[.env.development](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/.env.development)：示例与开发环境变量
- [index.html](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/index.html)：应用入口
- [package.json](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/package.json)、锁文件：依赖与脚本

## 技术选型与渲染方案

- Three.js 场景与交互
  - 透视相机、基础与环境光源、轨道控制器固定俯仰角，避免地图翻转
  - 渲染器启用 stencil，用于模板遮罩裁剪
- 墨卡托投影与边界处理
  - 使用 d3-geo 的 geoMercator，将经纬度映射到平面坐标系
  - 通过 GeoJSON 的 Polygon/MultiPolygon ring 绘制边界线与挤出形状
- 地图挤出与侧壁材质
  - 顶面材质关闭 colorWrite 与深度写入，仅保留侧壁可见
  - 侧壁使用 MeshStandardMaterial，结合 emissive 与透明度提升科技感
  - 参考实现见 [mesh.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/mesh.js#L180-L215)
- 人口柱状图与标签
  - 按区县中心点生成柱体，高度按最大值归一化，顶到底渐变颜色
  - 使用 three-spritetext 为区县名称与数值标签提供屏幕对齐文本
- 模板遮罩（Stencil）裁剪瓦片与特效
  - 基于行政边界生成遮罩平面，写入 stencilRef=1
  - 所有需要被裁剪的材质设置 stencilFunc=Equal/NotEqual 与 stencilRef=1
  - 实现底图、扫描层、脉冲圈等只在地图范围内生效
  - 参考实现见 [tile-utils.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/tile-utils.js#L40-L78)
- 底图瓦片（WMTS/TMS）
  - 天地图 WMTS：影像/标注/地形，可配置缩放级别与渲染顺序
  - 模板 URL TMS/XYZ：支持 yFlip 与模板占位符替换
  - 支持 8 个子域名轮询与失败回退
  - 参考实现见 [tiles.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/tiles.js)
- 科技感动效
  - 扫描覆盖层：ShaderMaterial 动态环形扫描与角度虚线叠加
    - 参考实现见 [main.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/main.js#L69-L128)
  - 脉冲圈：多相位并行扩散圈，强对比加法混合
    - 参考实现见 [main.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/main.js#L129-L189)
  - 同心装饰线：线段与圆线交替，透明度逐步递减
    - 参考实现见 [main.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/main.js#L190-L248)

## 环境变量（核心）

- 地图与边界
  - VITE_SHOW_BOUNDARY、VITE_SHOW_NAMES、VITE_SHOW_BOUNDARY_LINES
  - VITE_MAP_EXTRUDE_DEPTH、VITE_MAP_EXTRUDE_OPACITY、VITE_MAP_EXTRUDE_COLOR
  - VITE_MAP_EMISSIVE_COLOR、VITE_MAP_EMISSIVE_INTENSITY
  - VITE_MAP_EXTRUDE_EPS、VITE_MAP_EXTRUDE_Z、VITE_TDT_BASE_Z
- 瓦片底图
  - VITE_TDT_TOKEN 或 VITE_TDT_TK、VITE_TDT_LAYER、VITE_TDT_ZOOM
  - VITE_TDT_LABEL_LAYER、VITE_ENABLE_TDT_LABEL
  - VITE_TDT_BASE_Z、VITE_TDT_BASE_RO、VITE_TDT_LABEL_Z、VITE_TDT_LABEL_RO
  - VITE_TMS_URL、VITE_TMS_OVERLAY_URL、VITE_TMS_ZOOM/VITE_TMS_START_LEVEL、VITE_TMS_TMS
- 科技感装饰与动效
  - VITE_SHOW_DECOR、VITE_DECOR_COUNT、VITE_DECOR_RADIUS_START、VITE_DECOR_RADIUS_STEP
  - VITE_DECOR_OPACITY_START、VITE_DECOR_OPACITY_STEP、VITE_DECOR_Y
  - VITE_SHOW_PULSE、VITE_PULSE_COLOR、VITE_PULSE_OPACITY、VITE_PULSE_SPEED、VITE_PULSE_COUNT
  - VITE_PULSE_MIN_R、VITE_PULSE_MAX_R、VITE_PULSE_THICKNESS
  - VITE_SHOW_SCAN_OVERLAY、VITE_SCAN_COLOR、VITE_SCAN_OPACITY、VITE_SCAN_SPEED
  - VITE_SCAN_THICKNESS、VITE_SCAN_RINGS、VITE_SCAN_DASHES

## 依赖总体方案

- 运行时依赖
  - three：Three.js 核心渲染与几何、材质、控制器等
  - d3-geo：GeoJSON → 墨卡托投影坐标转换
  - gsap：柱体位移动画等动效驱动
  - three-spritetext：屏幕对齐文本标签
- 开发依赖
  - vite（rolldown-vite@7.2.5）：开发与构建工具
  - @types/three、@types/d3-geo：类型定义

## 数据与资源

- 边界数据：在线加载阿里数据 GeoJSON（云南省区县）
- 人口数据：演示数据位于 [data.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/data.js)
- 背景纹理：public/grid.png 提供网格背景

## 关键实现参考

- 入口与动效： [main.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/main.js)
- 地图挤出与柱体： [mesh.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/mesh.js)
- 模板遮罩与边界工具： [tile-utils.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/tile-utils.js)
- 天地图与模板瓦片： [tiles.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/tiles.js)
- 鉴权与子域分片： [tileAuth.js](file:///d:/code/threejs/Three.jsMastery/china-population-bar-chart/src/utils/tileAuth.js)
