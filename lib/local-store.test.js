import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { addLocalDocument, searchLocalKnowledge, tokenize } from './local-store.js';
test('本地知识库写入后可按中文与技术词检索并返回证据片段', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dsh-knowledge-'));
    const storePath = join(directory, 'knowledge.json');
    try {
        await addLocalDocument(storePath, 'React Hooks 笔记', 'useEffect 用于处理组件渲染后的副作用，例如订阅和请求。', '课程笔记');
        const evidences = await searchLocalKnowledge(storePath, 'useEffect 有什么作用？', 5);
        assert.equal(evidences.length, 1);
        assert.equal(evidences[0].documentTitle, 'React Hooks 笔记');
        assert.match(evidences[0].snippet, /副作用/);
    }
    finally {
        await rm(directory, { recursive: true, force: true });
    }
});
test('分词保留中文字符与技术标识', () => {
    assert.deepEqual(tokenize('学习 React useEffect'), ['学', '习', 'react', 'useeffect']);
});
