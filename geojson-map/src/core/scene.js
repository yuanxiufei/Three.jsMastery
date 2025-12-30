/**
 * 场景模块：创建 Scene，配置平行光、环境光和坐标轴辅助器，
 * 并返回场景实例供入口文件组装使用。
 */
import * as THREE from 'three'; // 引入 three.js

export function createScene() {
  const scene = new THREE.Scene(); // 创建场景
  // 配置光照与辅助器，便于观察坐标与法线方向

  const dirLight = new THREE.DirectionalLight(0xffffff); // 创建平行光
  dirLight.position.set(500, 300, 600); // 设置光源位置
  scene.add(dirLight); // 添加到场景

  const ambient = new THREE.AmbientLight(0xffffff, 1); // 创建环境光，强度 1
  scene.add(ambient); // 添加到场景

  const axes = new THREE.AxesHelper(1000); // 创建坐标轴辅助
  scene.add(axes); // 添加到场景

  return scene; // 返回场景实例
}
