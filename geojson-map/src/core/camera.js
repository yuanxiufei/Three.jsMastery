/**
 * 相机模块：创建透视相机并设置位置与朝向；
 * 提供在窗口尺寸变化时更新相机参数的辅助函数。
 */
import * as THREE from 'three'; // 引入 three.js

export function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(
    60,           // 视场角（FOV），越大视野越广
    width / height, // 长宽比，需与画布一致
    1,            // 近裁剪面，过小可能导致深度精度问题
    10000         // 远裁剪面，足够覆盖场景
  ); // 创建透视相机
  camera.position.set(0, 200, 600); // 设置相机位置（按用户要求）
  camera.lookAt(0, 0, 0); // 指向世界原点
  return camera; // 返回相机
}

export function updateCameraOnResize(camera, width, height) {
  camera.aspect = width / height; // 更新长宽比
  camera.updateProjectionMatrix(); // 更新投影矩阵
}
