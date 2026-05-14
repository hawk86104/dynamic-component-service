import type { PieChartData, PieColorScheme, SlicePalette } from './types'

export const DEFAULT_CHART_DATA: PieChartData = {
  title: 'Market Share',
  unit: '%',
  slices: [
    { label: 'Apple', value: 30 },
    { label: 'Samsung', value: 22 },
    { label: 'Xiaomi', value: 10 },
    { label: 'OPPO', value: 20 },
    { label: 'vivo', value: 18 },
  ],
}

export const DEFAULT_JSON_TEXT = JSON.stringify(DEFAULT_CHART_DATA, null, 2)

export const COLOR_SCHEMES: Record<PieColorScheme, SlicePalette[]> = {
  marketNeon: [
    { top: '#2eff6a', bottom: '#0a3d18', accent: '#c9ffd6', solid: '#00ff55' },
    { top: '#ff2878', bottom: '#4a0018', accent: '#ffd0df', solid: '#ff1868' },
    { top: '#ff8830', bottom: '#3d1800', accent: '#ffe0c0', solid: '#ff7718' },
    { top: '#b040ff', bottom: '#200850', accent: '#eed2ff', solid: '#a020ff' },
    { top: '#20e0ff', bottom: '#083848', accent: '#d4f8ff', solid: '#00d4ff' },
  ],
  aurora: [
    { top: '#67f7c4', bottom: '#083b36', accent: '#d9fff1', solid: '#19d99b' },
    { top: '#59d4ff', bottom: '#062a4e', accent: '#d6f3ff', solid: '#0aa8f4' },
    { top: '#8070ff', bottom: '#18114e', accent: '#dedbff', solid: '#6755f5' },
    { top: '#ff72d2', bottom: '#4c0b3f', accent: '#ffe0f5', solid: '#e94bad' },
    { top: '#d7ff55', bottom: '#354606', accent: '#f3ffd0', solid: '#aee52f' },
  ],
  sunset: [
    { top: '#ffd166', bottom: '#4c2804', accent: '#fff1cc', solid: '#ffb703' },
    { top: '#ff7a59', bottom: '#541407', accent: '#ffd7ce', solid: '#f45d48' },
    { top: '#ff4f92', bottom: '#52051f', accent: '#ffd2e4', solid: '#e73578' },
    { top: '#8054ff', bottom: '#160c48', accent: '#ded4ff', solid: '#6240d9' },
    { top: '#46c2ff', bottom: '#062f50', accent: '#d4f1ff', solid: '#168dd6' },
  ],
  jewel: [
    { top: '#64f4ff', bottom: '#063542', accent: '#d7fbff', solid: '#22c9d6' },
    { top: '#7af29a', bottom: '#0c3d17', accent: '#d9ffe4', solid: '#36d164' },
    { top: '#f0d36b', bottom: '#473807', accent: '#fff5cf', solid: '#d9aa2f' },
    { top: '#ff79a6', bottom: '#520b24', accent: '#ffe0ea', solid: '#e85286' },
    { top: '#a78bfa', bottom: '#24114f', accent: '#e9ddff', solid: '#8b5cf6' },
  ],
  candy: [
    { top: '#8be9fd', bottom: '#07364c', accent: '#dff8ff', solid: '#45c8ec' },
    { top: '#ffb3c7', bottom: '#50121f', accent: '#ffe4ed', solid: '#ff7198' },
    { top: '#caff8a', bottom: '#29440a', accent: '#f1ffd8', solid: '#8ee64b' },
    { top: '#ffd36e', bottom: '#4a3108', accent: '#fff4d4', solid: '#f2ad32' },
    { top: '#d1a7ff', bottom: '#321052', accent: '#f0ddff', solid: '#ad75ec' },
  ],
}

export const DEFAULT_COLOR_SCHEME: PieColorScheme = 'marketNeon'
