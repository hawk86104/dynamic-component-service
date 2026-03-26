import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@pangenerator/tweakpane-textarea-plugin'
import JSON5 from 'json5'

export interface ConfigSchemaItem {
  name: string
  com: 'Select' | 'ColorPicker' | 'Switch' | 'Slider' | 'jsonText' | 'ActionButton'
  action?: string
  options?: Array<{ label: string, value: any }>
  min?: number
  max?: number
  step?: number
}

export type ConfigSchema = Record<string, ConfigSchemaItem>

export interface ConfigPaneActionContext {
  actionId: string
  values: Record<string, any>
}

export interface CreateConfigPaneOptions {
  onAction?: (context: ConfigPaneActionContext) => void | Promise<void>
}

export function createConfigPane(
  config: ConfigSchema,
  values: Record<string, any>,
  container?: HTMLElement | null,
  options?: CreateConfigPaneOptions,
) {
  const pane = new Pane({
    container: container ?? undefined,
    title: '配置',
  }) as any

  pane.registerPlugin(EssentialsPlugin)

  Object.entries(config).forEach(([key, item]) => {
    switch (item.com) {
      case 'Select':
        pane
          .addBinding(values, key, {
            label: item.name,
            options: item.options?.reduce((acc, cur) => {
              acc[cur.label] = cur.value
              return acc
            }, {} as Record<string, any>),
          })
          .on('change', (ev: any) => {
            values[key] = ev.value
          })
        break

      case 'ColorPicker':
        pane
          .addBinding(values, key, {
            label: item.name,
            picker: 'inline',
          })
          .on('change', (ev: any) => {
            values[key] = ev.value
          })
        break

      case 'Switch':
        pane
          .addBinding(values, key, {
            label: item.name,
          })
          .on('change', (ev: any) => {
            values[key] = ev.value
          })
        break

      case 'Slider':
        pane
          .addBinding(values, key, {
            label: item.name,
            min: item.min,
            max: item.max,
            step: item.step,
          })
          .on('change', (ev: any) => {
            values[key] = ev.value
          })
        break

      case 'jsonText': {
        const textBinding = pane.addBinding(values, key, {
          view: 'textarea',
          label: item.name,
          rows: 8,
          placeholder: '请在此输入 JSON...',
        })

        values.jsonError = ''
        values.jsonTextChangeNumber = 0

        const errorBinding = pane.addBinding(values, 'jsonError', {
          label: 'JSON错误',
          readonly: true,
        })

        pane.addButton({ title: '应用JSON数据' }).on('click', () => {
          try {
            const parsed = JSON5.parse(values[key])
            values[key] = JSON.stringify(parsed, null, 2)
            values.jsonError = 'JSON 校验成功'
            textBinding.refresh()
            errorBinding.refresh()
            values.jsonTextChangeNumber++
          }
          catch (error: any) {
            values.jsonError = error.message
            errorBinding.refresh()
            console.warn('JSON 格式错误', error)
          }
        })
        break
      }

      case 'ActionButton':
        pane.addButton({ title: item.name }).on('click', async () => {
          await options?.onAction?.({
            actionId: item.action || key,
            values,
          })
        })
        break

      default:
        console.warn(`Unknown config control: ${item.com}`)
    }
  })

  return pane
}
