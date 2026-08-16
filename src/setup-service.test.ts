import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { KnowledgeSetupService, type SetupStatus } from './setup-service.js'

/** 等待后台准备任务落到终态，不调用任何真实外部命令。 */
async function waitForTerminal(service: KnowledgeSetupService): Promise<SetupStatus> {
  for (let index = 0; index < 100; index += 1) {
    const status = await service.describe()
    if (!status.running) return status
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 5))
  }
  throw new Error('测试中的准备任务未进入终态')
}

test('完整多模态缺少模型 Key 时不会启动准备任务', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-knowledge-setup-'))
  try {
    const service = new KnowledgeSetupService(home, undefined, {
      commandAvailable: async () => false,
      serviceReady: async () => false,
    })
    assert.throws(() => service.start(undefined, ''), /模型 API Key/)
    assert.equal((await service.describe()).phase, 'idle')
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('已健康的受控服务会直接复用且不进入外部安装命令', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-knowledge-setup-'))
  let commands = 0
  let readyCallbacks = 0
  try {
    const service = new KnowledgeSetupService(home, () => { readyCallbacks += 1 }, {
      commandAvailable: async () => { commands += 1; return true },
      serviceReady: async () => true,
    })
    service.start(undefined, '仅用于测试的模型-key')
    const status = await waitForTerminal(service)
    assert.equal(status.phase, 'ready')
    assert.equal(commands, 3)
    assert.equal(readyCallbacks, 1)
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('缺少系统前提时增强准备失败但明确保留本地模式', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-knowledge-setup-'))
  try {
    const service = new KnowledgeSetupService(home, undefined, {
      commandAvailable: async () => false,
      serviceReady: async () => false,
    })
    const started = service.start(undefined, '仅用于测试的模型-key')
    assert.equal(started.running, true)
    const status = await waitForTerminal(service)
    assert.equal(status.phase, 'failed')
    assert.equal(status.running, false)
    assert.match(status.message, /本地开箱即用模式仍可正常使用/)
    assert.match(status.error ?? '', /docker、git、conda/)
    assert.doesNotMatch(JSON.stringify(status), /仅用于测试的模型-key/)
    const persisted = await readFile(join(status.installRoot, 'setup-status.json'), 'utf8')
    assert.doesNotMatch(persisted, /仅用于测试的模型-key/)
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('已安装服务离线时回到可恢复状态而不残留就绪标记', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-knowledge-setup-'))
  try {
    const root = join(home, 'project-knowledge-review', 'full-rag')
    await mkdir(root, { recursive: true })
    await writeFile(join(root, 'setup-status.json'), JSON.stringify({ phase: 'ready', running: false, message: '旧就绪状态', installRoot: root, serviceUrl: 'http://127.0.0.1:8090', prerequisites: { docker: true, git: true, conda: true }, updatedAt: new Date().toISOString() }), 'utf8')
    const service = new KnowledgeSetupService(home, undefined, {
      commandAvailable: async () => true,
      serviceReady: async () => false,
    })
    const status = await service.describe()
    assert.equal(status.phase, 'idle')
    assert.match(status.message, /安全恢复/)
  } finally { await rm(home, { recursive: true, force: true }) }
})

test('只读预检可发现系统前提且外部健康服务不会被误认成插件服务', async () => {
  const home = await mkdtemp(join(tmpdir(), 'dsh-knowledge-setup-'))
  try {
    const service = new KnowledgeSetupService(home, undefined, {
      commandAvailable: async () => true,
      serviceReady: async () => false,
    })
    const status = await service.describe()
    assert.equal(status.phase, 'idle')
    assert.equal(status.message.includes('已就绪'), false)
    assert.deepEqual(status.prerequisites, { docker: true, git: true, conda: true })
  } finally { await rm(home, { recursive: true, force: true }) }
})
