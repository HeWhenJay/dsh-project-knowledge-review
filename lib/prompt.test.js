import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectKnowledgeReviewPrompt } from './prompt.js';
test('知识复习提示词要求先检索并在证据不足时拒答', () => {
    const prompt = buildProjectKnowledgeReviewPrompt({ projectName: '测试项目', mode: 'local', answerPolicy: 'strict', ocrEnabled: false, asrEnabled: false });
    assert.match(prompt, /project_knowledge_search/);
    assert.match(prompt, /不能回答/);
    assert.match(prompt, /project_knowledge_add_text/);
    assert.match(prompt, /project_knowledge_overview/);
});
test('参考知识库策略允许模型补充但要求分区标注', () => {
    const prompt = buildProjectKnowledgeReviewPrompt({ projectName: '测试项目', mode: 'project-rag', answerPolicy: 'reference', ocrEnabled: true, asrEnabled: true });
    assert.match(prompt, /参考知识库/);
    assert.match(prompt, /模型补充/);
});
