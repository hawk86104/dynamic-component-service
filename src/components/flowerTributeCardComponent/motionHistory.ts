import * as THREE from 'three'

export const TRAIL_HISTORY_SIZE = 32
const CAPACITY = 256

/** World-space history, resampled into the emitter's current local frame. */
export class CardMotionHistory {
  readonly matrices = Array.from({ length: TRAIL_HISTORY_SIZE }, () => new THREE.Matrix4())
  private readonly samples = Array.from({ length: CAPACITY }, () => ({ time: 0, matrix: new THREE.Matrix4() }))
  private readonly inverse = new THREE.Matrix4()
  private readonly interpolated = new THREE.Matrix4()
  private head = 0
  private count = 0
  private time = 0

  reset() {
    this.count = 0
    this.head = 0
    this.time = 0
    this.matrices.forEach(matrix => matrix.identity())
  }

  update(world: THREE.Matrix4, delta: number, duration: number): boolean {
    const determinant = world.determinant()
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
      this.reset()
      return false
    }
    if (!Number.isFinite(delta) || delta < 0 || delta > 0.5) {
      this.reset()
      delta = 0
    }
    this.time += delta
    const latest = this.samples[this.head]
    if (this.count === 0 || this.time - latest.time >= 1 / 30 - 1e-8) {
      this.head = this.count === 0 ? 0 : (this.head + 1) % CAPACITY
      this.samples[this.head].time = this.time
      this.samples[this.head].matrix.copy(world)
      this.count = Math.min(this.count + 1, CAPACITY)
    }
    this.inverse.copy(world).invert()
    let cursor = 0
    let newerTime = this.time
    let newerMatrix = world
    for (let i = 0; i < TRAIL_HISTORY_SIZE; i++) {
      const target = this.time - duration * i / (TRAIL_HISTORY_SIZE - 1)
      let older = this.samples[(this.head - cursor + CAPACITY) % CAPACITY]
      while (cursor < this.count - 1 && older.time > target) {
        newerTime = older.time
        newerMatrix = older.matrix
        cursor++
        older = this.samples[(this.head - cursor + CAPACITY) % CAPACITY]
      }
      const span = newerTime - older.time
      const alpha = span > 1e-8 ? THREE.MathUtils.clamp((target - older.time) / span, 0, 1) : 0
      for (let j = 0; j < 16; j++) {
        this.interpolated.elements[j] = THREE.MathUtils.lerp(older.matrix.elements[j], newerMatrix.elements[j], alpha)
      }
      this.matrices[i].multiplyMatrices(this.inverse, this.interpolated)
    }
    return true
  }
}
