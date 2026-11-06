import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

// Import only the selected TypeScript helpers in memory for offline conversion
// and CPU checks. This does not invoke Vite, write bundles or start a server.
const root = fileURLToPath(new URL('../../', import.meta.url))
const urls = new Map()

function sourceUrl(filename) {
  if (extname(filename) !== '.ts') {
    return pathToFileURL(filename).href
  }
  if (urls.has(filename)) {
    return urls.get(filename)
  }
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
    fileName: filename,
  })
  const output = outputText.replace(/\bfrom\s+(['"])([^'"]+)\1/g, (_, quote, specifier) => {
    if (!specifier.startsWith('.')) {
      return `from ${quote}${import.meta.resolve(specifier)}${quote}`
    }
    let dependency = resolve(dirname(filename), specifier)
    if (!extname(dependency) && existsSync(`${dependency}.ts`)) {
      dependency += '.ts'
    }
    return `from ${quote}${sourceUrl(dependency)}${quote}`
  })
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
  urls.set(filename, url)
  return url
}

export function importPixelFxSource(filename) {
  return import(sourceUrl(resolve(root, filename)))
}
