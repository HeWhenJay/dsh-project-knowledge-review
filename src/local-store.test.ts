import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { addLocalDocument, getLocalDocument, listLocalDocuments, searchLocalKnowledge, tokenize } from './local-store.js'

test('本地知识库写入后可按中文与技术词检索并返回证据片段', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-'))
  const storePath = join(directory, 'knowledge.json')
  try {
    await addLocalDocument(storePath, 'React Hooks 笔记', 'useEffect 用于处理组件渲染后的副作用，例如订阅和请求。', '课程笔记')
    const evidences = await searchLocalKnowledge(storePath, 'useEffect 有什么作用？', 5)
    assert.equal(evidences.length, 1)
    assert.equal(evidences[0].documentTitle, 'React Hooks 笔记')
    assert.match(evidences[0].snippet, /副作用/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('本地知识库列表只分页返回元数据，原文按单条读取', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-page-'))
  const storePath = join(directory, 'knowledge.json')
  try {
    const first = await addLocalDocument(storePath, '第一份资料', '第一份原文'.repeat(20), '测试来源')
    await addLocalDocument(storePath, '第二份资料', '第二份原文'.repeat(20), '测试来源')
    const page = await listLocalDocuments(storePath, undefined, 1)
    assert.equal(page.items.length, 1)
    assert.equal('content' in page.items[0], false)
    assert.equal(page.hasMore, true)
    assert.ok(page.nextCursor)
    assert.equal((await getLocalDocument(storePath, first.id))?.content.includes('第一份原文'), true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('索引末尾半行与残留 journal 会在下次访问时自动恢复', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-journal-'))
  const storePath = join(directory, 'knowledge.json')
  try {
    await addLocalDocument(storePath, '已有资料', '已有原文', '恢复测试')
    const document = { id: 'pending-2', title: '待恢复资料', source: '恢复测试', content: '待恢复原文', createdAt: '2025-01-02T00:00:00.000Z' }
    const crypto = await import('node:crypto')
    const record = { sequence: 2, id: document.id, title: document.title, source: document.source, createdAt: document.createdAt, contentLength: document.content.length, tokens: ['待', '恢', '复'], contentFile: `${crypto.createHash('sha256').update(document.id).digest('hex')}.json` }
    await writeFile(`${storePath}.journal.json`, JSON.stringify({ version: 1, document, record }), 'utf8')
    await import('node:fs/promises').then(({ appendFile }) => appendFile(`${storePath}.index.jsonl`, '{"sequence":2,"id":"pending'))
    const page = await listLocalDocuments(storePath, undefined, 30)
    assert.equal(page.total, 2)
    assert.equal(page.items[0].id, 'pending-2')
    assert.equal((await getLocalDocument(storePath, 'pending-2'))?.content, '待恢复原文')
    await assert.rejects(stat(`${storePath}.journal.json`), /ENOENT/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('并发写入保持唯一顺序与准确总数', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-concurrent-'))
  const storePath = join(directory, 'knowledge.json')
  try {
    await Promise.all(Array.from({ length: 40 }, (_, index) => addLocalDocument(storePath, `并发资料 ${index}`, `并发原文 ${index}`, '并发测试')))
    const first = await listLocalDocuments(storePath, undefined, 25)
    const second = await listLocalDocuments(storePath, first.nextCursor, 25)
    assert.equal(first.total, 40)
    assert.equal(first.items.length, 25)
    assert.equal(second.items.length, 15)
    assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 40)
    assert.equal(JSON.parse(await readFile(storePath, 'utf8')).documentCount, 40)
    const lines = (await readFile(`${storePath}.index.jsonl`, 'utf8')).trim().split(/\r?\n/).map((line) => JSON.parse(line))
    assert.equal(new Set(lines.map((line) => line.sequence)).size, 40)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('已有旧备份时迁移会创建唯一新备份而不覆盖历史备份', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-backup-'))
  const storePath = join(directory, 'knowledge.json')
  const legacy = { version: 1, documents: [{ id: 'new-old', title: '当前旧库', source: '迁移', content: '当前完整原文', createdAt: '2025-01-01T00:00:00.000Z' }] }
  try {
    await writeFile(storePath, JSON.stringify(legacy), 'utf8')
    await writeFile(`${storePath}.v1.backup.json`, '历史备份不得覆盖', 'utf8')
    await listLocalDocuments(storePath, undefined, 30)
    assert.equal(await readFile(`${storePath}.v1.backup.json`, 'utf8'), '历史备份不得覆盖')
    const names = await import('node:fs/promises').then(({ readdir }) => readdir(directory))
    const unique = names.find((name) => name.startsWith('knowledge.json.v1.backup.') && name.endsWith('.json'))
    assert.ok(unique)
    assert.equal(JSON.parse(await readFile(join(directory, unique!), 'utf8')).documents[0].id, 'new-old')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('旧版整库 JSON 自动迁移并保留原始备份', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-migrate-'))
  const storePath = join(directory, 'knowledge.json')
  const legacy = { version: 1, documents: [
    { id: 'old-1', title: '旧资料一', source: '旧来源', content: '旧原文一', createdAt: '2025-01-01T00:00:00.000Z' },
    { id: 'old-2', title: '旧资料二', source: '旧来源', content: '旧原文二', createdAt: '2025-01-02T00:00:00.000Z' },
  ] }
  try {
    await writeFile(storePath, JSON.stringify(legacy), 'utf8')
    const page = await listLocalDocuments(storePath, undefined, 1)
    assert.equal(page.items[0].id, 'old-2')
    assert.equal(page.hasMore, true)
    const second = await listLocalDocuments(storePath, page.nextCursor, 1)
    assert.equal(second.items[0].id, 'old-1')
    assert.equal((await getLocalDocument(storePath, 'old-1'))?.content, '旧原文一')
    assert.equal(JSON.parse(await readFile(storePath, 'utf8')).version, 2)
    assert.equal(JSON.parse(await readFile(`${storePath}.v1.backup.json`, 'utf8')).documents.length, 2)
    assert.ok((await stat(`${storePath}.index.jsonl`)).size > 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('分词保留中文字符与技术标识', () => {
  assert.deepEqual(tokenize('学习 React useEffect'), ['学', '习', 'react', 'useeffect'])
})
