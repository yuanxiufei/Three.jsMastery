/**
 * 控制器模块：创建 OrbitControls，启用阻尼并设置观察目标，
 * 提供用户旋转、缩放与平移交互能力。
 */
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 引入轨道控制器

export function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement); // 基于相机与画布创建控制器
  controls.enableDamping = true; // 开启阻尼，更平滑
  controls.target.set(0, 0, 0); // 观察目标设为原点
  // 如需限制缩放或旋转范围，可设置 minDistance/maxDistance、maxPolarAngle 等参数
  return controls; // 返回控制器
}
