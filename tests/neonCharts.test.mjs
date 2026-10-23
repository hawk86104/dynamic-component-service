import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
// eslint-disable-next-line test/no-import-node-test -- Use the built-in runner; this repository has no Vitest dependency.
import { test } from 'node:test'
import * as THREE from 'three'
import ts from 'typescript'
import { parseAreaData, parseDonutData, sampleArea } from '../src/components/chart3d/data.ts'
import { addStage, clearChart, createLabel } from '../src/components/chart3d/scene.ts'
import { NEON_DONUT_DEFAULTS } from '../src/components/neonDonutChartComponent/defaults.ts'
import { createDonutSector } from '../src/components/neonDonutChartComponent/geometry.ts'
import { RIBBON_AREA_DEFAULTS } from '../src/components/ribbonAreaChartComponent/defaults.ts'
import { createRibbonGeometry } from '../src/components/ribbonAreaChartComponent/geometry.ts'

test('reference defaults preserve totals, palette and shared category lengths', () => {
  const donut = parseDonutData(NEON_DONUT_DEFAULTS.jsonText)
  assert.equal(donut.items.reduce((sum, item) => sum + item.value, 0), 6050)
  assert.equal(new Set(donut.items.map(item => item.color)).size, 5)
  const area = parseAreaData(RIBBON_AREA_DEFAULTS.jsonText)
  assert.equal(area.series.length, 2)
  assert.deepEqual(area.series.map(series => Math.max(...series.values)), [350, 322])
  assert.ok(area.series.every(series => series.values.length === area.categories.length))
})

test('JSON5, custom heights and optional names/colors are supported', () => {
  const donut = parseDonutData('{items: [{value: 12, height: 2.5, color: "#fa0"}, {value: 0}],}')
  assert.equal(donut.items[0].height, 2.5)
  assert.equal(donut.items[1].value, 0)
  assert.notEqual(donut.items[0].id, donut.items[1].id)
  assert.equal(parseAreaData('{categories: ["A"], series: [{values: [0]}]}').series[0].values[0], 0)
})

test('donut schema rejects unusable data instead of silently changing the business values', () => {
  for (const input of [
    '{',
    '[]',
    '{}',
    '{items: []}',
    '{items: [{value: 0}]}',
    '{items: [{value: -1}]}',
    '{items: [{value: NaN}]}',
    '{items: [{value: Infinity}]}',
    '{items: [{value: "12"}]}',
    '{items: [{value: 2, color: "red"}]}',
    '{items: [{value: 1, height: 0}]}',
    '{items: [{value: 1, height: 50}]}',
    '{items: [{id: "same", value: 1}, {id: "same", value: 2}]}',
    JSON.stringify({ items: Array.from({ length: 33 }, () => ({ value: 1 })) }),
  ]) {
    assert.throws(() => parseDonutData(input), input)
  }
})

test('area schema rejects mismatched samples, negative/nonfinite values and bad palettes', () => {
  for (const input of [
    '{categories: [], series: []}',
    '{categories: ["A", "B"], series: [{values: [1]}]}',
    '{categories: ["A"], series: [{values: [-1]}]}',
    '{categories: ["A"], series: [{values: [Infinity]}]}',
    '{categories: ["A"], series: [{values: [1], colors: ["#fff"]}]}',
    '{categories: ["A"], series: [{values: [1], colors: [null, "#fff", "#000"]}]}',
    '{categories: [""], series: [{values: [1]}]}',
    '{categories: ["A"], series: [{id: "a", values: [1]}, {id: "a", values: [2]}]}',
    JSON.stringify({ categories: ['A'], series: Array.from({ length: 9 }, () => ({ values: [1] })) }),
    JSON.stringify({ categories: Array.from({ length: 129 }, () => 'A'), series: [{ values: Array.from({ length: 129 }).fill(1) }] }),
  ]) {
    assert.throws(() => parseAreaData(input), input)
  }
})

test('monotone smoothing passes through samples and never overshoots adjacent values', () => {
  const datasets = [[0, 0, 0], [0, 10, 0], [5, 5, 6, 0, 100], [0.1, 0.2, 0.15]]
  for (let seed = 1; seed <= 40; seed++) {
    datasets.push(Array.from({ length: 12 }, (_, index) => Math.abs(Math.sin(seed * 17 + index * 37)) * 1000))
  }
  for (const values of datasets) {
    const points = sampleArea(values, 24)
    values.forEach((value, index) => assert.equal(points[index * 24].y, value))
    for (const point of points) {
      const index = Math.min(Math.floor(point.x), values.length - 2)
      assert.ok(point.y >= Math.min(values[index], values[index + 1]) - 1e-9)
      assert.ok(point.y <= Math.max(values[index], values[index + 1]) + 1e-9)
    }
  }
  assert.deepEqual(sampleArea([0], 12), [{ x: 0, y: 0 }, { x: 1, y: 0 }])
  assert.deepEqual(sampleArea([], 12), [])
  assert.equal(sampleArea([4, 12], 2, false)[1].y, 8)
})

function finiteGeometry(geometry) {
  for (const name of ['position', 'normal']) {
    assert.ok([...geometry.getAttribute(name).array].every(Number.isFinite), name)
  }
}

test('donut sectors remain hollow and have the requested standing height', () => {
  for (const [start, end] of [[0, Math.PI / 2], [0, Math.PI * 2], [2, 2.0001]]) {
    const { geometry, top } = createDonutSector(1.2, 2.25, 1.8, start, end, 0.045)
    finiteGeometry(geometry)
    assert.ok(Math.abs(geometry.boundingBox.min.y) < 1e-5)
    assert.ok(Math.abs(geometry.boundingBox.max.y - top) < 1e-5)
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    assert.equal(new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0)).intersectObject(mesh).length, 0)
    if (end - start > 0.1) {
      const mid = (start + end) / 2
      const origin = new THREE.Vector3(Math.cos(mid) * 1.7, 10, -Math.sin(mid) * 1.7)
      assert.ok(new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0)).intersectObject(mesh).length > 0)
    }
    geometry.dispose()
    mesh.material.dispose()
  }
})

test('area ribbons are watertight, outward-facing solids including the two end caps', () => {
  const geometry = createRibbonGeometry([{ x: -2, y: 1 }, { x: 0, y: 3 }, { x: 3, y: 2 }], 0.8)
  finiteGeometry(geometry)
  const positions = geometry.getAttribute('position')
  const edges = new Map()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  let volume = 0
  for (let index = 0; index < positions.count; index += 3) {
    a.fromBufferAttribute(positions, index)
    b.fromBufferAttribute(positions, index + 1)
    c.fromBufferAttribute(positions, index + 2)
    volume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6
    const keys = [a, b, c].map(point => point.toArray().map(value => value.toFixed(5)).join(','))
    for (let vertex = 0; vertex < 3; vertex++) {
      const key = [keys[vertex], keys[(vertex + 1) % 3]].sort().join('|')
      edges.set(key, (edges.get(key) || 0) + 1)
    }
  }
  assert.ok([...edges.values()].every(count => count === 2))
  assert.ok(Math.abs(volume - 9.2) < 1e-5)
  geometry.dispose()
})

test('single-category and all-zero ribbons keep finite geometry and nonzero thickness', () => {
  for (const values of [[0], [0, 0, 0], [7], [1e-12, 1e12]]) {
    const geometry = createRibbonGeometry(sampleArea(values), 0.8)
    finiteGeometry(geometry)
    assert.ok(geometry.boundingBox.max.x > geometry.boundingBox.min.x)
    assert.ok(geometry.boundingBox.max.y > 0)
    geometry.dispose()
  }
})

test('optional stage helpers can be disabled and shared resources are disposed once', () => {
  const group = new THREE.Group()
  addStage(group, { width: 5, depth: 3, baseColor: '#123', gridColor: '#456', showBase: false, showGrid: false })
  assert.equal(group.children.length, 0)
  const geometry = new THREE.BoxGeometry()
  const texture = new THREE.Texture()
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const disposed = { geometry: 0, material: 0, texture: 0 }
  geometry.addEventListener('dispose', () => disposed.geometry++)
  material.addEventListener('dispose', () => disposed.material++)
  texture.addEventListener('dispose', () => disposed.texture++)
  group.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material))
  clearChart(group)
  assert.equal(group.children.length, 0)
  assert.deepEqual(disposed, { geometry: 1, material: 1, texture: 1 })
})

test('summary percentages remain correct for fractional totals below one', () => {
  const previousDocument = globalThis.document
  const drawnText = []
  const context = {
    beginPath() {},
    roundRect() {},
    fill() {},
    stroke() {},
    fillRect() {},
    fillText(value) { drawnText.push(value) },
  }
  globalThis.document = { createElement: () => ({ getContext: () => context }) }
  try {
    const label = createLabel('Fractional data', '0.5', '#fff', 1, [
      { name: 'A', value: 0.2, color: '#f00' },
      { name: 'B', value: 0.3, color: '#0f0' },
    ])
    assert.ok(drawnText.includes('40.0%'))
    assert.ok(drawnText.includes('60.0%'))
    const group = new THREE.Group()
    group.add(label)
    clearChart(group)
  }
  finally {
    if (previousDocument === undefined) {
      delete globalThis.document
    }
    else {
      globalThis.document = previousDocument
    }
  }
})

test('both dynamic component entries have real assets and controls for all editable defaults', () => {
  const source = ts.createSourceFile('dcsConfig.ts', readFileSync(new URL('../src/dcsConfig.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  let entries = []
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'components' && ts.isArrayLiteralExpression(node.initializer)) {
      entries = [...node.initializer.elements]
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  const property = (node, name) => node.properties.find(item => item.name?.getText(source) === name)?.initializer
  for (const [type, defaults] of [['neonDonutChartComponent', NEON_DONUT_DEFAULTS], ['ribbonAreaChartComponent', RIBBON_AREA_DEFAULTS]]) {
    const found = entries.filter(entry => property(entry, 'type')?.text === type)
    assert.equal(found.length, 1, type)
    const entry = found[0]
    const componentPath = property(entry, 'comFile').text.replace(/^\.\//, '')
    const previewPath = property(entry, 'previewPath').text.replace(/^\.\//, '')
    assert.ok(existsSync(new URL(`../${componentPath}`, import.meta.url)))
    assert.ok(existsSync(new URL(`../public/${previewPath}`, import.meta.url)))
    const controls = new Set(property(entry, 'config').properties.map(item => item.name.getText(source)))
    for (const key of Object.keys(defaults).filter(key => key !== 'jsonTextChangeNumber')) {
      assert.ok(controls.has(key), `${type}.${key}`)
    }
  }
})
