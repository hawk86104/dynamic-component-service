uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform float uWindFrequency;
uniform float uWindTurbulence;
uniform float uWindLean;
uniform vec2 uWindDirection;

varying float vBladeHeight;
varying vec3 vBladeNormal;
varying vec3 vWorldPosition;

mat3 inverseTransposeMat3(mat3 matrix) {
  vec3 row0 = cross(matrix[1], matrix[2]);
  vec3 row1 = cross(matrix[2], matrix[0]);
  vec3 row2 = cross(matrix[0], matrix[1]);
  float determinant = dot(matrix[0], row0);
  return mat3(row0, row1, row2) / determinant;
}

void main() {
  vBladeHeight = uv.y;
  vec3 transformed = position;
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
  float tipMask = vBladeHeight * vBladeHeight;
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
  transformed += localWind * tipMask;

  vBladeNormal = normalize(inverseTransposeMat3(mat3(instanceWorldMatrix)) * normal);
  vWorldPosition = (instanceWorldMatrix * vec4(transformed, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
}
