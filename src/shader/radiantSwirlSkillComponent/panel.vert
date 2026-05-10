precision highp float;

uniform float uHalfSize;
uniform mat4 uInvModel;

varying vec3 vLocal;      // 片元在立方体本地坐标, 归一化到 [-1, 1]
varying vec3 vCamLocal;   // 摄像机位置在立方体本地坐标, 归一化到 [-1, 1]

void main() {
  vLocal = position / max(uHalfSize, 0.0001);

  // 把 three 的 cameraPosition(world) 变换到物体本地空间，再归一化
  vec3 camLocalUnit = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
  vCamLocal = camLocalUnit / max(uHalfSize, 0.0001);

  csm_Position = position;
}
