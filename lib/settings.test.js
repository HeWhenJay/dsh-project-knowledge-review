import assert from 'node:assert/strict';
import test from 'node:test';
import { ASR_API_KEY_REF, KnowledgeSettingsSchema, OCR_API_KEY_REF, validateKnowledgeSettings } from './settings.js';
test('知识复习设置只提供独立本地库和关闭的 OCR/ASR 默认值', () => {
    const settings = KnowledgeSettingsSchema({});
    assert.equal(settings.enabled, true);
    assert.equal(settings.answerPolicy, 'reference');
    assert.equal(settings.ocrEnabled, false);
    assert.equal(settings.asrEnabled, false);
    assert.equal(settings.ocrApiKeyEnv, OCR_API_KEY_REF);
    assert.equal(settings.asrApiKeyEnv, ASR_API_KEY_REF);
    assert.equal('mode' in settings, false);
    assert.equal('ragBaseUrl' in settings, false);
    assert.equal('projectCapabilityEnv' in settings, false);
});
test('启用外部媒体服务时拒绝非 HTTP URL 和 URL 用户信息', () => {
    const fileSettings = KnowledgeSettingsSchema({ ocrEnabled: true, ocrBaseUrl: 'file:///tmp/ocr' });
    assert.throws(() => validateKnowledgeSettings(fileSettings), /OCR Base URL/);
    const credentialSettings = KnowledgeSettingsSchema({ asrEnabled: true, asrBaseUrl: 'https://user:pass@example.com/v1' });
    assert.throws(() => validateKnowledgeSettings(credentialSettings), /ASR Base URL/);
});
