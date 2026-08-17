import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectKnowledgeReviewPrompt } from './prompt.js';
test('知识复习提示词要求先检索并在证据不足时拒答', () => {
    const prompt = buildProjectKnowledgeReviewPrompt({ projectName: '测试知识库', answerPolicy: 'strict', ocrEnabled: false, asrEnabled: false });
    assert.match(prompt, /project_knowledge_search/);
    assert.match(prompt, /不能回答/);
    assert.match(prompt, /project_knowledge_add_text/);
    assert.match(prompt, /project_knowledge_overview/);
    assert.match(prompt, /(?:不会|不要声称).*外部项目/);
});
test('知识库仅供参考策略允许模型补充但要求分区标注', () => {
    const prompt = buildProjectKnowledgeReviewPrompt({ projectName: '测试知识库', answerPolicy: 'reference', ocrEnabled: true, asrEnabled: true });
    assert.match(prompt, /知识库仅供参考/);
    assert.match(prompt, /模型补充/);
    assert.doesNotMatch(prompt, /project-rag|当前项目复习中心/);
});
