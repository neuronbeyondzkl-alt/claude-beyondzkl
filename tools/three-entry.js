// 生成 assets/js/vendor/three.bundle.min.js 的入口：只导出本项目用到的 three.js 模块，便于摇树压缩。
// 重新构建：npm install && npm run vendor
export {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  DataTexture, RGBAFormat, FloatType, NearestFilter, Vector2, Matrix4, Quaternion, Euler, Vector3,
  Mesh, PlaneGeometry, AdditiveBlending, SRGBColorSpace, NoToneMapping, Color,
} from 'three';
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
export { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
