import assert from 'node:assert/strict';
import test from 'node:test';
import { ASR_API_KEY_REF, KnowledgeSettingsSchema, OCR_API_KEY_REF, RAG_API_KEY_REF, validateKnowledgeSettings } from './settings.js';
test('知识复习设置提供零配置本地模式和关闭的 OCR/ASR 默认值', () => {
    const settings = KnowledgeSettingsSchema({});
    assert.equal(settings.enabled, true);
    assert.equal(settings.mode, 'local');
    assert.equal(settings.answerPolicy, 'strict');
    assert.equal(settings.ragApiKeyEnv, RAG_API_KEY_REF);
    assert.equal(settings.ocrEnabled, false);
    assert.equal(settings.asrEnabled, false);
    assert.equal(settings.ocrApiKeyEnv, OCR_API_KEY_REF);
    assert.equal(settings.asrApiKeyEnv, ASR_API_KEY_REF);
});
test('启用外部服务时拒绝非 HTTP URL', () => {
    const settings = KnowledgeSettingsSchema({ ocrEnabled: true, ocrBaseUrl: 'file:///tmp/ocr' });
    assert.throws(() => validateKnowledgeSettings(settings), /OCR Base URL/);
});
