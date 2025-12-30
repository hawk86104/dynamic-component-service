/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 09:16:25
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-30 10:50:30
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
  ],
}

export default config
