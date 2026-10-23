# 霓虹三维图表

两个组件均为 TresJS 场景中的真实 Three.js 几何体，可独立作为 federation 动态组件加载。组件目录中已附默认参数；在组件列表中选择「霓虹立体环形图」或「流光立体面积图」即可通过现有预览入口调参。

## 1. 霓虹立体环形图

- 类型：`neonDonutChartComponent`
- 入口：`src/components/neonDonutChartComponent/index.vue`
- 参考结构：不同高度的空心扇区、圆角边缘、荧光配色、半透明侧壁、圆盘底座和悬浮统计卡片。

`jsonText` 接收 JSON 字符串，示例：

```json
{
  "title": "总量统计",
  "unit": "万",
  "items": [
    { "id": "a", "name": "综合业务", "value": 2350, "color": "#f2ee00" },
    { "id": "b", "name": "其他业务", "value": 1500, "color": "#d6e0ed" },
    { "id": "c", "name": "线上渠道", "value": 950, "color": "#b800ff" },
    { "id": "d", "name": "线下渠道", "value": 700, "color": "#00baff", "height": 0.8 },
    { "id": "e", "name": "新兴业务", "value": 550, "color": "#20ff55" }
  ]
}
```

| 字段 | 规则 |
| --- | --- |
| `title` / `unit` | 可选的统计标题、数值单位；默认标题为「总量统计」 |
| `items` | 1～32 项，至少一项的值大于零 |
| `items[].id` | 可选，自动按位置生成；显式 ID 不得重复 |
| `items[].name` | 可选的分类名称 |
| `items[].value` | 必填，非负有限数值，决定角度与百分比；零值不绘制扇区 |
| `items[].color` | 可选的 `#RGB` / `#RRGGBB` 颜色，省略时按预设色系取色 |
| `items[].height` | 可选，0.05～12 世界单位，优先于自动高度和统一高度 |

总数自动求和，默认数据为 **6,050**。未指定单项高度时，`heightByValue=true` 将高度按数值映射到 `minHeight`～`height`；关闭后统一使用 `height`。百分比始终使用原始数值计算，统计卡片最多显示前五项及合并的其余分类。极小占比（弧度不足 `0.00001`）仅计入统计，避免生成退化几何。

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `radius` | 2.25 | 外半径，0.5～8 |
| `innerRatio` | 0.56 | 内半径占外半径的比例，0.15～0.85 |
| `height` / `minHeight` | 1.75 / 0.45 | 自动高度范围；最小高度不超过最大高度 |
| `heightByValue` | true | 自动按值设置高度 |
| `gapAngle` | 3 | 扇区间隔，单位为度；小扇区自动缩小间隔 |
| `startAngle` | 155 | 起始角度 |
| `bevel` | 0.045 | 倒角大小；受间隙、扇区厚度和高度共同限制 |
| `useDataColors` | true | 使用单项颜色；关闭后完全按色系取色 |
| `palette` | `neon` | `neon` 荧光撞色、`ocean` 青蓝、`sunset` 暖色 |
| `showSummary` | true | 显示总量与占比统计卡片 |
| `showLabels` | false | 显示每项百分比标签及引导线 |
| `labelSize` | 0.8 | 标签世界尺寸；统计卡片为该值的 1.65 倍 |

## 2. 流光立体面积图

- 类型：`ribbonAreaChartComponent`
- 入口：`src/components/ribbonAreaChartComponent/index.vue`
- 参考结构：带厚度的平滑面积实体，序列沿 Z 轴分离，蓝青至黄绿/珊瑚的渐变顶面，明亮双边轮廓、峰值卡片与玻璃背板。

```json
{
  "title": "业务增长趋势",
  "unit": "万元",
  "categories": ["1月", "2月", "3月", "4月", "5月", "6月"],
  "series": [
    {
      "id": "online",
      "name": "线上业务",
      "values": [45, 105, 90, 220, 205, 350],
      "colors": ["#008cff", "#32e9dc", "#d2ee29"]
    },
    {
      "id": "offline",
      "name": "线下业务",
      "values": [28, 85, 165, 145, 322, 280],
      "colors": ["#098aff", "#bb9efc", "#ff826f"]
    }
  ]
}
```

| 字段 | 规则 |
| --- | --- |
| `title` / `unit` | 可选的图表标题和数值单位 |
| `categories` | 1～128 个非空字符串，沿 X 轴等距排布；不按日期或数值间隔插值 |
| `series` | 1～8 条序列，沿 Z 轴按数组顺序由后向前排列 |
| `series[].id` / `name` | 可选的唯一标识与名称 |
| `series[].values` | 必填，与 `categories` 等长的非负有限数值数组 |
| `series[].colors` | 可选，严格为三个十六进制色值，依次为 X 轴起点/中点/终点渐变色 |

所有序列共用 Y 轴尺度。`yMax=0` 自动取数据最大值；手动上限小于数据最大值时会扩大到数据最大值，避免截断。全零数据保留一条薄基线；单分类数据展开为整条等高面积带。曲线采用单调三次 Hermite 插值，穿过每个样本且不超出相邻样本值，避免平滑过冲造成数据失真。

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `width` / `height` | 5 / 2.8 | X 轴世界宽度和最大世界高度 |
| `ribbonWidth` | 0.85 | 单条实体在 Z 方向的厚度 |
| `seriesGap` | 0.55 | 序列之间的净间距 |
| `yMax` | 0 | Y 轴数值上限；0 为自动；传参支持至 1e12 |
| `smooth` | true | 平滑曲线；关闭后使用线性插值 |
| `curveSegments` | 16 | 每两个分类之间的细分数，1～32 |
| `useDataColors` | true | 使用序列自己的三色渐变；省略序列颜色时仍使用全局颜色 |
| `colorStart` | `#008cff` | 全局起点颜色 |
| `colorMiddle` | `#36e5df` | 全局中点颜色 |
| `colorEnd` | `#d2ee29` | 全局终点颜色 |
| `outlineWidth` | 0.016 | 发光轮廓的世界半径 |
| `showLabels` | true | 显示每条序列的最大值和名称；重复峰值取第一个 |
| `showAxes` | true | 显示分类、Y 刻度和标题；分类较多时自动稀疏标注 |
| `showBackPanel` | true | 显示玻璃背板和水平参考线 |
| `labelSize` | 0.85 | 峰值标签世界宽度 |

## 公共参数与调用

| 参数 | 说明 |
| --- | --- |
| `jsonText` | 数据 JSON/JSON5 字符串；直接更新即可生效 |
| `jsonTextChangeNumber` | 可选刷新计数，默认 0，兼容现有「应用 JSON」按钮 |
| `opacity` | 不透明度 0.1～1，环图默认 0.82、面积图默认 0.78 |
| `glowIntensity` | 高光强度 0～3，环图默认 0.65、面积图默认 0.7 |
| `textColor` | 标签文字颜色 |
| `showBase` / `showGrid` | 独立控制底座与网格地面，默认均开启 |
| `baseColor` / `gridColor` | 底座和网格颜色；面积图背板沿用网格色 |

通过现有编辑器的 `config` 控件可修改所有可视参数；`jsonTextChangeNumber` 是协议字段，由 JSON 控件维护。要统一更改默认配色，先关闭「使用数据配色」。几何参数均以组件局部世界单位计，整体位置/旋转/缩放仍由宿主 Object3D 控制。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import NeonDonutChart from '../src/components/neonDonutChartComponent/index.vue'
import RibbonAreaChart from '../src/components/ribbonAreaChartComponent/index.vue'

const donutJson = ref(JSON.stringify({ items: [{ name: 'A', value: 60 }, { name: 'B', value: 40 }] }))
const areaJson = ref(JSON.stringify({ categories: ['Q1', 'Q2'], series: [{ name: '营收', values: [120, 180] }] }))
const dataError = ref('')
</script>

<template>
  <!-- 放入已有 TresCanvas；相机、灯光和后处理由宿主统一提供。 -->
  <NeonDonutChart :json-text="donutJson" :position="[-4, 0, 0]" @data-error="dataError = $event" />
  <RibbonAreaChart :json-text="areaJson" :position="[4, 0, 0]" @data-error="dataError = $event" />
</template>
```

数值必须在 0～1e12 之间，名称最多保留 80 个字符。错误 JSON、负值、不等长序列、重复 ID 和错误颜色都不会替换上一份有效数据；初始输入无效时展示默认数据。组件发出 `dataError` 事件（模板中为 `@data-error`），并通过组件 ref 暴露 `dataError`；恢复有效数据后错误清空并发出空字符串。参数面板的 JSON 提示负责语法校验，业务接入方可监听该事件呈现语义错误。

组件没有自己的相机、灯光、Canvas 或持续动画循环，不依赖外部模型/贴图。轮廓与 Fresnel 高光可在无 Bloom 时显示；需要更大的光晕可由宿主添加后处理。透明实体在复杂交叠视角下受 WebGL 透明排序影响，可将 `opacity` 调为 1。标签较多时可关闭分项标签。

## 验证

```bash
node --test tests/neonCharts.test.mjs
node_modules/.bin/eslint src/components/chart3d src/components/neonDonutChartComponent src/components/ribbonAreaChartComponent tests/neonCharts.test.mjs
node_modules/.bin/vue-tsc --noEmit
```

测试覆盖数据契约、参考数据、平滑插值边界、环形空心结构、面积实体闭合与朝向、单点/全零数据和共享资源清理。构建、服务启动和浏览器视觉验证遵守 `AGENTS.md`，本次未自动执行。
