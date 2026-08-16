import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

import { addLocalDocument, listLocalSummaries, searchLocalKnowledge } from './local-store.js'

/** Host 入口只依赖插件自己的本地库，Web 设置仍使用独立 bundle。 */
test('主机端保留独立本地知识库与摘要能力', async () => {
  assert.equal(typeof addLocalDocument, 'function')
  assert.equal(typeof listLocalSummaries, 'function')
  assert.equal(typeof searchLocalKnowledge, 'function')

  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    exports: Record<string, string>
    dsh: { client: { inject: string[] } }
  }
  assert.equal(packageJson.exports['./client'], './lib/web-client.js')
  assert.equal(packageJson.exports['./package.json'], './package.json')
  assert.ok(packageJson.dsh.client.inject.includes('@deepseek-ai/dsh-client-connection'))

  const host = await readFile(new URL('./index.js', import.meta.url), 'utf8')
  const webClient = await readFile(new URL('./web-client.js', import.meta.url), 'utf8')
  assert.match(host, /addLocalDocument/)
  assert.doesNotMatch(host, /dsh-plugin\/rag|ProjectBinding|KnowledgeSetupService/)
  assert.match(webClient, /__ModuleLoader__\.load/)
  assert.match(webClient, /var module = \{ exports: \{\} \}/)
  assert.match(webClient, /settings\.section/)
  assert.match(webClient, /sectionHeader.*sectionLabel/)
  assert.match(webClient, /addEventListener\("pointerdown".*true\)/)
  assert.match(webClient, /dsh-taskboard-entry.*data-active/)
})

test('Web bundle 可在 DSH ModuleLoader factory 中执行并返回插件导出', async () => {
  const webClient = await readFile(new URL('./web-client.js', import.meta.url), 'utf8')
  let registration: { id: string; factory: (require: (id: string) => unknown) => Record<string, unknown> } | undefined
  runInNewContext(webClient, {
    window: {
      __ModuleLoader__: {
        load(value: typeof registration) { registration = value },
      },
    },
  })
  assert.equal(registration?.id, 'dsh-project-knowledge-review')
  const component = () => null
  const modules: Record<string, unknown> = {
    react: { useEffect: () => undefined, useMemo: (value: () => unknown) => value(), useRef: (value: unknown) => ({ current: value }), useState: (value: unknown) => [value, () => undefined] },
    'react/jsx-runtime': { jsx: component, jsxs: component, Fragment: Symbol('Fragment') },
    'react-dom/client': { createRoot: () => ({ render: () => undefined, unmount: () => undefined }) },
    '@deepseek-ai/dsh-client-ui-primitives': { Button: component, Input: component, StateDot: component },
  }
  const exports = registration?.factory((id) => {
    if (!(id in modules)) throw new Error(`测试缺少浏览器外部模块：${id}`)
    return modules[id]
  })
  assert.equal(typeof exports?.apply, 'function')
  assert.equal(Array.from(exports?.inject as string[]).join(','), 'slots,connection')
})

test('插件 Host 入口可动态导入且保留配置与 apply 导出', async () => {
  const host = await import('./index.js')
  assert.equal(typeof host.apply, 'function')
  assert.ok(host.Config)
})
