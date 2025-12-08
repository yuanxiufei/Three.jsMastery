# Three.js Mastery 项目说明

本仓库用于学习与实践 Three.js。当前包含一个示例子目录 `first-scene/`，演示如何在浏览器中通过 ES Modules 加载 Three.js 并渲染一个基础场景。

## 目录结构

```
Three.jsMastery/
├─ first-scene/
│  ├─ index.html       # 页面入口，包含 import map 配置
│  ├─ index.js         # Three.js 场景代码（ESM）
│  └─ package.json     # 子项目包信息（含 @types/three）
└─ .gitignore          # 忽略 first-scene/node_modules
```

## 环境要求

- 现代浏览器，支持 ES Modules 和 Import Maps（Chrome 89+、Edge 89+、Safari 16+、Firefox 108+）。
- 推荐使用任意静态 HTTP 服务器（避免直接用 `file://` 打开）。
- 可选：Node.js（用于本地静态服务或安装依赖）。

## 快速开始

- 方式一：使用 CDN Import Map（默认配置）
  - 进入仓库根目录并启动一个静态服务器，示例命令：
    - Node：`npx http-server -p 8080 .` 或 `npx serve .`
    - Python：`python -m http.server 8080`
  - 浏览器访问：`http://localhost:8080/first-scene/index.html`

- 方式二：本地安装 three（可选）
  - 进入 `first-scene/` 并安装：`npm install three`
  - 在 `index.html` 的 import map 中将 `three` 指向本地路径（例如 `./node_modules/three/build/three.module.js`），并通过静态服务器访问页面。

## 代码概览

- 模块导入：`first-scene/index.js:1` 使用 `import * as THREE from "three"`。
- Import Map：`first-scene/index.html:14-20` 将 `three` 映射到 CDN 模块 URL。
- 页面加载脚本：`first-scene/index.html:26` 以模块方式加载 `./index.js`。
- 场景内容：`first-scene/index.js` 创建一个橙色立方体、点光源、透视相机，并通过 `WebGLRenderer` 渲染到页面。

## 常见问题

- 浏览器控制台报错：`Failed to resolve module specifier "three"`
  - 原因：在浏览器原生 ES Modules 中使用裸模块名，需要借助 Import Map 或打包工具。
  - 解决：本项目已在 `index.html` 中配置 Import Map，确保通过 HTTP 服务访问页面即可。

- `favicon.ico` 404
  - 非必需资源；如需移除错误提示，可在根或 `first-scene/` 下放置 `favicon.ico`，或删除相关 `<link rel="icon">` 引用。

## 开发与扩展

- 在 `first-scene/index.js` 中添加几何体、材质、光源或相机交互即可扩展场景。
- 若计划使用 TypeScript，可在子项目中安装 `typescript` 并改用 `.ts`，当前已包含 `@types/three` 以辅助类型提示。
- 若需多场景示例，可按 `first-scene/` 结构新建子目录，并为每个示例配置独立的 `index.html` 与 Import Map。

## 部署

- 本项目为纯静态站点，任何静态托管（如 GitHub Pages、Vercel、Netlify）均可直接部署。
- 确保托管环境正确提供 `index.html` 与模块文件的 HTTP 访问。

## 参考

- Three.js 文档：https://threejs.org/docs/
- Import Maps 规范：https://wicg.github.io/import-maps/
- ESM CDN（示例使用）：https://esm.sh/
