import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyKnowledgeIntent } from './intent.js';
test('知识库内容、存储和共享问题路由到概览意图', () => {
    assert.equal(classifyKnowledgeIntent('当前知识库有哪些内容？内容存储在哪里？是否和当前项目共用？'), 'knowledge-inventory');
    assert.equal(classifyKnowledgeIntent('列出知识库中的资料标题和来源'), 'knowledge-inventory');
    assert.equal(classifyKnowledgeIntent('给我看看我之前存过什么'), 'knowledge-inventory');
    assert.equal(classifyKnowledgeIntent('这些资料是在这个工程里还是全局？'), 'knowledge-inventory');
    assert.equal(classifyKnowledgeIntent('这个库现在多大？'), 'knowledge-inventory');
});
test('学习问题和导入请求使用各自意图', () => {
    assert.equal(classifyKnowledgeIntent('useEffect 有什么作用？'), 'knowledge-question');
    assert.equal(classifyKnowledgeIntent('把这段笔记添加到知识库'), 'knowledge-import');
});
