import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { importProjectVideo, searchProjectKnowledge } from './client.js'

test('主机端 RAG 客户端不会被网页设置面板覆盖', async () => {
  assert.equal(typeof searchProjectKnowledge, 'function')
  assert.equal(typeof importProjectVideo, 'function')

  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    exports: Record<string, string>
    dsh: { client: { inject: string[] } }
  }
  assert.equal(packageJson.exports['./client'], './lib/web-client.js')
  assert.equal(packageJson.exports['./package.json'], './package.json')
  assert.ok(packageJson.dsh.client.inject.includes('@deepseek-ai/dsh-client-connection'))

  const hostClient = await readFile(new URL('./client.js', import.meta.url), 'utf8')
  const webClient = await readFile(new URL('./web-client.js', import.meta.url), 'utf8')
  assert.match(hostClient, /export async function searchProjectKnowledge/)
  assert.doesNotMatch(hostClient, /__ModuleLoader__/)
  assert.match(webClient, /__ModuleLoader__\.load/)
  assert.match(webClient, /settings\.section/)
})

test('插件 Host 入口可动态导入且保留配置与 apply 导出', async () => {
  const host = await import('./index.js')
  assert.equal(typeof host.apply, 'function')
  assert.ok(host.Config)
})
