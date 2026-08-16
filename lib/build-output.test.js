import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { importProjectVideo, searchProjectKnowledge } from './client.js';
test('主机端 RAG 客户端不会被网页设置面板覆盖', async () => {
    assert.equal(typeof searchProjectKnowledge, 'function');
    assert.equal(typeof importProjectVideo, 'function');
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(packageJson.exports['./client'], './lib/web-client.js');
    assert.equal(packageJson.exports['./package.json'], './package.json');
    assert.ok(packageJson.dsh.client.inject.includes('@deepseek-ai/dsh-client-connection'));
    const hostClient = await readFile(new URL('./client.js', import.meta.url), 'utf8');
    const webClient = await readFile(new URL('./web-client.js', import.meta.url), 'utf8');
    assert.match(hostClient, /export async function searchProjectKnowledge/);
    assert.doesNotMatch(hostClient, /__ModuleLoader__/);
    assert.match(webClient, /__ModuleLoader__\.load/);
    assert.match(webClient, /var module = \{ exports: \{\} \}/);
    assert.match(webClient, /settings\.section/);
});
test('Web bundle 可在 DSH ModuleLoader factory 中执行并返回插件导出', async () => {
    const webClient = await readFile(new URL('./web-client.js', import.meta.url), 'utf8');
    let registration;
    runInNewContext(webClient, {
        window: {
            __ModuleLoader__: {
                load(value) { registration = value; },
            },
        },
    });
    assert.equal(registration?.id, 'dsh-project-knowledge-review');
    const component = () => null;
    const modules = {
        react: { useEffect: () => undefined, useState: (value) => [value, () => undefined] },
        'react/jsx-runtime': { jsx: component, jsxs: component, Fragment: Symbol('Fragment') },
        '@deepseek-ai/dsh-client-ui-primitives': { Button: component, Input: component, StateDot: component },
    };
    const exports = registration?.factory((id) => {
        if (!(id in modules))
            throw new Error(`测试缺少浏览器外部模块：${id}`);
        return modules[id];
    });
    assert.equal(typeof exports?.apply, 'function');
    assert.equal(Array.from(exports?.inject).join(','), 'slots,connection');
});
test('插件 Host 入口可动态导入且保留配置与 apply 导出', async () => {
    const host = await import('./index.js');
    assert.equal(typeof host.apply, 'function');
    assert.ok(host.Config);
});
