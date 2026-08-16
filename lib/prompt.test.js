import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectKnowledgeReviewPrompt } from './prompt.js';
test('知识复习提示词要求先检索并在证据不足时拒答', () => {
    const prompt = buildProjectKnowledgeReviewPrompt('测试项目');
    assert.match(prompt, /project_knowledge_search/);
    assert.match(prompt, /不能回答/);
    assert.match(prompt, /公开视频 URL/);
});
