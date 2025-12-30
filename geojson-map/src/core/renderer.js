/**
 * 渲染器模块：创建 WebGLRenderer，设置尺寸与像素比，返回渲染器实例；
 * 控制像素比避免过高导致性能问题。
 */
import * as THREE from 'three'; // 引入 three.js

export function createRenderer(width, height) {
  const renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建渲染器，开启抗锯齿
  renderer.setSize(width, height); // 设置渲染尺寸
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 控制像素比，避免过高导致性能问题
  // 如果项目需要更高画质，像素比可以适当提高，但注意性能
  return renderer; // 返回渲染器
}
