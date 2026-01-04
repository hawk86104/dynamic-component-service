/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 09:16:25
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-01-04 09:54:09
 */
const config = {
  name: 'baseSample',
  version: '1.0.1',
  description: '动态组件服务示例组件库',
  components: [
    {
      name: '测试空组件',
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
      name: '简单柱体表格',
      type: 'simpleColumn',
      comFile: './src/components/simpleColumn/index.vue',
      previewPath: './preview/simpleColumn.png',
      default: {
        spacing: 0, // 间距
        distribution: 'proportional', // 布局方式
        width: 4 / 3, // 宽度
        titleSize: 0.8, // 标题大小
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
        width: { name: '总宽度', com: 'Slider', min: 0.1, max: 5, step: 0.01 },
        titleSize: { name: '标题大小', com: 'Slider', min: 0.1, max: 2, step: 0.1 },
      },
    },
  ],
}

export default config
