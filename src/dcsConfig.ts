/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 09:16:25
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-22 10:03:22
 */
const config = {
  name: 'baseSample',
  version: '1.2.0',
  description: `tvt.js 动态组件服务示例组件库<br>
  新增：<a style="color: #5384ff;" href="https://github.com/dgreenheck/ez-tree" target="_blank">开源ez-tree</a>组件，实现高级树模型展示，<a style="color: #03765b;" href="https://www.eztree.dev" target="_blank">配置生成器</a>，SavePreset导出配置`,
  components: [
    {
      name: '测试组件',
      type: 'testBase',
      comFile: './src/components/testBase.vue',
      previewPath: './preview/testBase.png',
      default: {},
      defaultObject3D: {},
      config: {},
    },
    {
      name: '动态旋转基座',
      type: 'dynamicRotatingBase',
      comFile: './src/components/dynamicRotatingBase.vue',
      previewPath: './preview/dynamicRotatingBase.png',
      default: {
        type: 'imgA',
        color: '#fff',
        opacity: 0.95,
        rotationZ: 0.01,
        videoLoop: false,
      },
      defaultObject3D: {
        position: { x: 0, y: 0.2, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
      },
      config: {
        type: {
          name: '类型',
          com: 'Select',
          options: ['imgA', 'imgB', 'imgC'].map(item => ({
            label: item,
            value: item,
          })),
        },
        color: { name: '颜色', com: 'ColorPicker' },
        videoLoop: { name: '视频重复', com: 'Switch' },
        rotationZ: { name: '自转速度', com: 'Slider', min: -0.1, max: 0.1, step: 0.01 },
        opacity: { name: '透明度', com: 'Slider', min: 0, max: 1, step: 0.01 },
      },
    },
    {
      name: '简单柱体图表',
      type: 'simpleColumn',
      comFile: './src/components/simpleColumn/index.vue',
      previewPath: './preview/simpleColumn.png',
      default: {
        spacing: 0, // 间距
        distribution: 'proportional', // 布局方式
        width: 4 / 3, // 宽度
        titleSize: 10, // 标题大小
        fontColor: '#ffffff',
        materialType: "MeshPhysicalMaterial",
        metalness: 0.5,
        roughness: 0.5,
        clearcoat: 0.2,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
        opacity: 1,
        jsonText: `[
{ value: 43, title: '%',color:'#5072c4' },
{ value: 24, title: '%', color:'#92cb79' },
{ value: 12, title: '%', color:'#fcc660' },
{ value: 39, title: '%', color:'#f8285b' },
{ value: 14, title: '%', color:'#ff0ecb' },
]`
      },
      defaultObject3D: {
        position: { x: 0, y: 0.1, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
      },
      config: {
        spacing: { name: '柱体间距', com: 'Slider', min: 0, max: 1, step: 0.01 },
        distribution: {
          name: '布局方式',
          com: 'Select',
          options: ['uniform', 'proportional'].map(item => ({
            label: item,
            value: item,
          })),
        },
        width: { name: '总宽度', com: 'Slider', min: 0.01, max: 3, step: 0.01 },
        titleSize: { name: '标题大小', com: 'Slider', min: 1, max: 32, step: 0.2 },
        fontColor: { name: '字体颜色', com: 'ColorPicker' },
        materialType: {
          name: '材质类型',
          com: 'Select',
          options: ["MeshBasicMaterial", "MeshLambertMaterial", "MeshPhongMaterial", "MeshStandardMaterial", "MeshPhysicalMaterial", "MeshToonMaterial", "MeshGlassMaterial"].map(item => ({
            label: item,
            value: item,
          })),
        },
        metalness: { name: '金属度', com: 'Slider', min: 0, max: 1, step: 0.01 },
        roughness: { name: '粗糙度', com: 'Slider', min: 0, max: 1, step: 0.01 },
        clearcoat: { name: '清晰度', com: 'Slider', min: 0, max: 1, step: 0.01 },
        clearcoatRoughness: { name: '清晰度粗糙度', com: 'Slider', min: 0, max: 1, step: 0.01 },
        reflectivity: { name: '反射率', com: 'Slider', min: 0, max: 1, step: 0.01 },
        opacity: { name: '透明度', com: 'Slider', min: 0, max: 1, step: 0.01 },
        jsonText: { name: '数据配置', com: 'jsonText' },
      },
    },
    {
      name: '高级树组件',
      type: 'ezTreeCom',
      comFile: './src/components/ezTreeCom.vue',
      previewPath: './preview/ezTreeCom.png',
      default: {
        isUpdate: true,
        jsonText: `{
  "seed": 36330,
  "type": "deciduous",
  "bark": {
    "type": "oak",
    "tint": 13552830,
    "flatShading": false,
    "textured": true,
    "textureScale": {
      "x": 0.5,
      "y": 5
    }
  },
  "branch": {
    "levels": 3,
    "angle": {
      "1": 48,
      "2": 75,
      "3": 60
    },
    "children": {
      "0": 7,
      "1": 4,
      "2": 3
    },
    "force": {
      "direction": {
        "x": 0,
        "y": 1,
        "z": 0
      },
      "strength": -0.06
    },
    "gnarliness": {
      "0": 0.03,
      "1": 0.25,
      "2": 0.2,
      "3": 0.09
    },
    "length": {
      "0": 43.47,
      "1": 27.14,
      "2": 9.51,
      "3": 4.6
    },
    "radius": {
      "0": 2,
      "1": 0.63,
      "2": 0.76,
      "3": 0.7
    },
    "sections": {
      "0": 12,
      "1": 8,
      "2": 6,
      "3": 4
    },
    "segments": {
      "0": 12,
      "1": 6,
      "2": 4,
      "3": 3
    },
    "start": {
      "1": 0.23,
      "2": 0.33,
      "3": 0
    },
    "taper": {
      "0": 0.7,
      "1": 0.7,
      "2": 0.7,
      "3": 0.7
    },
    "twist": {
      "0": 0.09,
      "1": -0.07,
      "2": 0,
      "3": 0
    }
  },
  "leaves": {
    "type": "ash",
    "billboard": "double",
    "angle": 55,
    "count": 16,
    "start": 0,
    "size": 2.67,
    "sizeVariance": 0.72,
    "tint": 16777215,
    "alphaTest": 0.5
  },
  "trellis": {
    "enabled": false,
    "position": {
      "x": 0,
      "y": 0,
      "z": -2
    },
    "width": 10,
    "height": 20,
    "spacing": 2,
    "force": {
      "strength": 0.02,
      "maxDistance": 3,
      "falloff": 1
    },
    "cylinderRadius": 0.05,
    "visible": true,
    "color": 9127187
  }
}`},
      defaultObject3D: {},
      config: {
        isUpdate: { name: '摆动', com: 'Switch' },
        jsonText: { name: 'ez-tree配置', com: 'jsonText' },
      },
    },
  ],
}

export default config
