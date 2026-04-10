/*
 * @Description:
 * @Version: 1.668
 * @Autor: 地虎降天龙
 * @Date: 2026-01-14 09:40:09
 * @LastEditors: 地虎降天龙
 * @LastEditTime: 2026-03-25 10:20:41
 */
import express from 'express'
import { createServer } from 'node:http'
// import { join } from 'node:path'
import path from 'node:path'

const app = express()
const distPath = path.resolve('dist')
const remoteEntryPath = path.join('assets', 'remoteEntry.js')

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    const normalizedFilePath = path.normalize(filePath)
    if (normalizedFilePath.endsWith(remoteEntryPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
  },
}))

const server = createServer(app)

server.listen(5000, 'localhost', () => {
  // eslint-disable-next-line no-console
  console.log('✅ remote running at http://localhost:5000')
})
