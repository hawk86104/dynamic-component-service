import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
// eslint-disable-next-line test/no-import-node-test -- Use the built-in runner; this repository has no Vitest dependency.
import { test } from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import * as THREE from 'three'
import ts from 'typescript'
import { createRenderer, defineComponent, h, nextTick, reactive } from 'vue'
import { parseAreaData, parseDonutData, sampleArea } from '../src/components/chart3d/data.ts'
import { addStage, clearChart, createLabel } from '../src/components/chart3d/scene.ts'
import { NEON_DONUT_DEFAULTS } from '../src/components/neonDonutChartComponent/defaults.ts'
import { createDonutSector } from '../src/components/neonDonutChartComponent/geometry.ts'
import { RIBBON_AREA_DEFAULTS, RIBBON_AREA_PROPS } from '../src/components/ribbonAreaChartComponent/defaults.ts'
import { createRibbonGeometry } from '../src/components/ribbonAreaChartComponent/geometry.ts'
import { createRibbonGlassMaterial, createRibbonSideMaterial } from '../src/components/ribbonAreaChartComponent/material.ts'

function ribbonSideShaders() {
  return {
    vertexShader: readFileSync(new URL('../src/shader/ribbonAreaChartComponent/side.vert', import.meta.url), 'utf8'),
    fragmentShader: readFileSync(new URL('../src/shader/ribbonAreaChartComponent/side.frag', import.meta.url), 'utf8'),
  }
}

test('the Vue entry declares every ribbon control at runtime and accepts live side updates', async () => {
  const filename = new URL('../src/components/ribbonAreaChartComponent/index.vue', import.meta.url).pathname
  const source = readFileSync(new URL('../src/components/ribbonAreaChartComponent/index.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source, { filename }).descriptor, { id: 'ribbon-runtime-props' })
  const compiled = ts.createSourceFile('ribbon.ts', script.content, ts.ScriptTarget.Latest, true)
  let propsDeclaration
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText(compiled) === 'props') {
      propsDeclaration = node.initializer
    }
    ts.forEachChild(node, visit)
  }
  visit(compiled)
  assert.equal(propsDeclaration?.getText(compiled), 'RIBBON_AREA_PROPS')
  assert.deepEqual(Object.keys(RIBBON_AREA_PROPS).sort(), Object.keys(RIBBON_AREA_DEFAULTS).sort())
  const renderer = createRenderer({
    createComment: () => ({}),
    insert() {},
    remove() {},
    parentNode: () => null,
    nextSibling: () => null,
  })
  const values = reactive({})
  const warnings = []
  let received
  const component = defineComponent({
    props: RIBBON_AREA_PROPS,
    setup(props) {
      received = props
      return () => null
    },
  })
  const app = renderer.createApp({ setup: () => () => h(component, values) })
  app.config.warnHandler = message => warnings.push(message)
  app.mount({})
  try {
    assert.deepEqual({ ...received }, RIBBON_AREA_DEFAULTS)
    for (const sideColor of ['#0033d8', '#ff0000', '#00ff00']) {
      Object.assign(values, { sideColor, bevel: 0.1, reflectionStrength: 2, roughness: 0.6, sideGradient: 0.4, sideOpacity: 0.2 })
      await nextTick()
      for (const [key, value] of Object.entries(values)) {
        assert.equal(received[key], value, key)
      }
      const material = createRibbonSideMaterial(received, ribbonSideShaders())
      assert.equal(material.color.getHexString(), sideColor.slice(1))
      assert.equal(material.opacity, RIBBON_AREA_DEFAULTS.opacity * 0.2)
      material.dispose()
    }
    assert.deepEqual(warnings, [])
  }
  finally {
    app.unmount()
  }
})

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
  for (const bevel of [0, 0.055]) {
    const geometry = createRibbonGeometry([{ x: -2, y: 1 }, { x: 0, y: 3 }, { x: 3, y: 2 }], 0.8, bevel)
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
    assert.ok(bevel ? volume > 9.18 && volume < 9.2 : Math.abs(volume - 9.2) < 1e-5)
    assert.ok(Math.abs(geometry.boundingBox.max.y - 3) < 1e-5)
    assert.ok(Math.abs(geometry.boundingBox.max.z - 0.4) < 1e-5)
    geometry.dispose()
  }
})

test('rounded roofs share continuous unit normals and walls use their own local height', () => {
  const points = sampleArea([0.4, 2, 0.8, 3, 1.5], 12)
  const geometry = createRibbonGeometry(points, 0.9, 0.055)
  finiteGeometry(geometry)
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const surfaces = geometry.getAttribute('surface')
  const localHeights = new Map(points.map(point => [point.x.toFixed(5), point.y]))
  const roofNormals = new Map()
  const normal = new THREE.Vector3()
  let sharedRoofVertices = 0
  for (let index = 0; index < positions.count; index++) {
    normal.fromBufferAttribute(normals, index)
    assert.ok(Math.abs(normal.length() - 1) < 1e-5)
    const height = localHeights.get(positions.getX(index).toFixed(5))
    assert.ok(Math.abs(surfaces.getY(index) - positions.getY(index) / height) < 1e-5)
    if (surfaces.getX(index) > 0.999) {
      const key = [positions.getX(index), positions.getY(index), positions.getZ(index)].map(value => value.toFixed(5)).join(',')
      if (roofNormals.has(key)) {
        assert.ok(normal.distanceTo(roofNormals.get(key)) < 1e-6)
        sharedRoofVertices++
      }
      roofNormals.set(key, normal.clone())
    }
  }
  assert.ok(sharedRoofVertices > 100)
  geometry.dispose()
})

test('linear mode preserves flat slope normals while keeping the rounded width edges', () => {
  const geometry = createRibbonGeometry([{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 0.5 }], 0.8, 0.055, false)
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const surfaces = geometry.getAttribute('surface')
  for (let index = 0; index < positions.count; index += 3) {
    const centerX = (positions.getX(index) + positions.getX(index + 1) + positions.getX(index + 2)) / 3
    const slope = centerX < 1 ? 1 : -1.5
    for (let vertex = index; vertex < index + 3; vertex++) {
      if (surfaces.getX(vertex) > 0.999) {
        assert.ok(Math.abs(normals.getX(vertex) + slope / Math.hypot(slope, 1)) < 1e-5)
      }
    }
  }
  geometry.dispose()
})

test('single-category and all-zero ribbons keep finite geometry and nonzero thickness', () => {
  for (const values of [[0], [0, 0, 0], [7], [1e-12, 1e12]]) {
    for (const bevel of [0, 0.055]) {
      const geometry = createRibbonGeometry(sampleArea(values), 0.8, bevel)
      finiteGeometry(geometry)
      assert.ok(geometry.boundingBox.max.x > geometry.boundingBox.min.x)
      assert.ok(geometry.boundingBox.max.y > 0)
      geometry.dispose()
    }
  }
})

test('side opacity keeps the material transparent independently of full overall opacity', () => {
  const shaders = {
    vertexShader: readFileSync(new URL('../src/shader/ribbonAreaChartComponent/chart.vert', import.meta.url), 'utf8'),
    fragmentShader: readFileSync(new URL('../src/shader/ribbonAreaChartComponent/chart.frag', import.meta.url), 'utf8'),
  }
  for (const [opacity, sideOpacity, transparent] of [[1, 0, true], [1, 0.25, true], [1, 1, false], [0.7, 1, true]]) {
    const style = { ...RIBBON_AREA_DEFAULTS, opacity, sideOpacity }
    const material = createRibbonGlassMaterial(style, ['#00f', '#0ff', '#cf0'], shaders)
    assert.equal(material.transparent, transparent)
    assert.equal(material.depthWrite, !transparent)
    assert.equal(material.side, transparent ? THREE.DoubleSide : THREE.FrontSide)
    assert.equal(material.uniforms.uSideOpacity.value, sideOpacity)
    material.dispose()
    const side = createRibbonSideMaterial(style, ribbonSideShaders())
    assert.equal(side.transparent, transparent)
    assert.equal(side.depthWrite, !transparent)
    assert.equal(side.opacity, opacity * sideOpacity)
    side.dispose()
  }
})

test('visible walls and end caps use the native side material with the selected color', () => {
  const points = [{ x: -2, y: 1 }, { x: 0, y: 3 }, { x: 3, y: 2 }]
  const geometry = createRibbonGeometry(points, 0.8, 0.055)
  assert.equal(geometry.groups.length, 2)
  for (const sideColor of ['#0033d8', '#ff0000', '#00ff00']) {
    const style = { ...RIBBON_AREA_DEFAULTS, sideColor }
    const roof = createRibbonGlassMaterial(style, ['#00f', '#0ff', '#cf0'], { vertexShader: '', fragmentShader: '' })
    const side = createRibbonSideMaterial(style, ribbonSideShaders())
    const mesh = new THREE.Mesh(geometry, [roof, side])
    const wallHit = new THREE.Raycaster(new THREE.Vector3(0, 1, 10), new THREE.Vector3(0, 0, -1)).intersectObject(mesh)[0]
    const capHit = new THREE.Raycaster(new THREE.Vector3(-5, 0.5, 0), new THREE.Vector3(1, 0, 0)).intersectObject(mesh)[0]
    const roofHit = new THREE.Raycaster(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -1, 0)).intersectObject(mesh)[0]
    assert.equal(wallHit.face.materialIndex, 1)
    assert.equal(capHit.face.materialIndex, 1)
    assert.equal(roofHit.face.materialIndex, 0)
    const visibleSide = mesh.material[wallHit.face.materialIndex]
    assert.equal(visibleSide.isMeshBasicMaterial, true)
    assert.equal(visibleSide.color.getHexString(), sideColor.slice(1))
    roof.dispose()
    side.dispose()
  }
  geometry.dispose()
})

test('side vertex gradients stay neutral so they cannot replace blue with grey-white', () => {
  for (const gradient of [0, 1]) {
    const geometry = createRibbonGeometry([{ x: 0, y: 2 }, { x: 2, y: 3 }], 0.8, 0.055, true, { gradient, opaque: false })
    const wall = geometry.groups[1]
    const colors = geometry.getAttribute('color')
    const positions = geometry.getAttribute('position')
    assert.equal(colors.itemSize, 4)
    let bottomCount = 0
    for (let index = wall.start; index < wall.start + wall.count; index++) {
      assert.equal(colors.getX(index), colors.getY(index))
      assert.equal(colors.getY(index), colors.getZ(index))
      if (gradient === 0) {
        assert.equal(colors.getX(index), 1)
        assert.equal(colors.getW(index), 1)
      }
      else if (positions.getY(index) === 0) {
        assert.ok(Math.abs(colors.getX(index) - 0.08) < 1e-6)
        assert.ok(Math.abs(colors.getW(index) - 0.3) < 1e-6)
        bottomCount++
      }
    }
    assert.ok(gradient === 0 || bottomCount > 0)
    geometry.dispose()
  }
})

test('native side coating keeps a single shader entry point and the normal color pipeline', () => {
  const material = createRibbonSideMaterial(RIBBON_AREA_DEFAULTS, ribbonSideShaders())
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.basic.vertexShader, fragmentShader: THREE.ShaderLib.basic.fragmentShader }
  material.onBeforeCompile(shader, null)
  assert.equal([...shader.vertexShader.matchAll(/void\s+main\s*\(/g)].length, 1)
  assert.equal([...shader.fragmentShader.matchAll(/void\s+main\s*\(/g)].length, 1)
  assert.ok(shader.fragmentShader.includes('#include <color_fragment>'))
  assert.equal(shader.uniforms.uRibbonSideReflection.value, RIBBON_AREA_DEFAULTS.reflectionStrength)
  material.dispose()
})

test('side color and gradient controls are independent of the data-driven roof palette', () => {
  const shaders = { vertexShader: '', fragmentShader: '' }
  for (const [sideColor, sideGradient] of [['#ff0000', 0], ['#00ff00', 1], ['#0000ff', 0.5]]) {
    const material = createRibbonGlassMaterial({ ...RIBBON_AREA_DEFAULTS, sideColor, sideGradient }, ['#008cff', '#32e9dc', '#d2ee29'], shaders)
    assert.ok(material.uniforms.uSideColor.value.equals(new THREE.Color(sideColor)))
    assert.equal(material.uniforms.uSideGradient.value, sideGradient)
    assert.ok(material.uniforms.uStart.value.equals(new THREE.Color('#008cff')))
    assert.ok(material.uniforms.uMiddle.value.equals(new THREE.Color('#32e9dc')))
    assert.ok(material.uniforms.uEnd.value.equals(new THREE.Color('#d2ee29')))
    material.dispose()
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
    assert.deepEqual([...controls].sort(), Object.keys(defaults).filter(key => key !== 'jsonTextChangeNumber').sort(), type)
  }
})
