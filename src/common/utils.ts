/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2025-12-29 11:03:09
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2025-12-29 11:16:21
 */
import dcsConfig from '../dcsConfig.js'
export function getResUrl(path: string) {
  const g = window as any
  const base =
    g.__REMOTE_ASSET_MAP__?.[dcsConfig.name] || import.meta.env.BASE_URL

  return base + path
}
