uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform float uWindFrequency;
uniform float uWindTurbulence;
uniform float uWindLean;
uniform vec2 uWindDirection;

attribute float aVariant;
attribute vec3 aPetalColor;
attribute vec3 aFoliageColor;
attribute vec3 aCentreColor;

varying vec2 vMaskUv;
varying vec3 vPetalColor;
varying vec3 vFoliageColor;
varying vec3 vCentreColor;

void main() {
  vMaskUv = vec2((uv.x + aVariant) / 3.0, uv.y);
  vPetalColor = aPetalColor;
  vFoliageColor = aFoliageColor;
  vCentreColor = aCentreColor;

  mat4 instanceWorldMatrix = modelMatrix * instanceMatrix;
  vec3 baseWorldPosition = (instanceWorldMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float primaryWave = sin(
    dot(baseWorldPosition.xz, uWindDirection) * uWindFrequency
    + uTime * uWindSpeed
  );
  vec2 perpendicular = vec2(-uWindDirection.y, uWindDirection.x);
  float secondaryWave = sin(
    dot(baseWorldPosition.xz, perpendicular) * uWindFrequency * 1.7
    + uTime * uWindSpeed * 0.73
  ) * uWindTurbulence;
  vec3 worldWind = vec3(uWindDirection.x, 0.0, uWindDirection.y)
    * ((primaryWave + secondaryWave) * uWindStrength + uWindLean);

  vec3 axisX = vec3(instanceWorldMatrix[0]);
  vec3 axisY = vec3(instanceWorldMatrix[1]);
  vec3 axisZ = vec3(instanceWorldMatrix[2]);
  vec3 localWind = vec3(
    dot(worldWind, axisX) / max(dot(axisX, axisX), 0.00001),
    dot(worldWind, axisY) / max(dot(axisY, axisY), 0.00001),
    dot(worldWind, axisZ) / max(dot(axisZ, axisZ), 0.00001)
  );
  float tipMask = uv.y * uv.y;
  vec3 transformed = position + localWind * tipMask * 0.45;
  vec4 worldPosition = instanceWorldMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
