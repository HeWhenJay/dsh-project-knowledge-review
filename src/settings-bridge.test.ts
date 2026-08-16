import assert from 'node:assert/strict'
import test from 'node:test'
import type { IncomingMessage } from 'node:http'
import { isTrustedLocalRequest } from './settings-bridge.js'

/** 构造最小请求对象，验证回环地址不等于跨端口同源授权。 */
function request(method: string, origin?: string, host = '127.0.0.1:3080', fetchSite?: string): IncomingMessage {
  return {
    method,
    headers: { ...(origin ? { origin } : {}), host, ...(fetchSite ? { 'sec-fetch-site': fetchSite } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as IncomingMessage
}

test('写接口只允许与当前 DSH 主机和端口完全相同的 Origin', () => {
  assert.equal(isTrustedLocalRequest(request('POST', 'http://127.0.0.1:3080')), true)
  assert.equal(isTrustedLocalRequest(request('POST', 'http://127.0.0.1:5173')), false)
  assert.equal(isTrustedLocalRequest(request('POST', 'http://localhost:3080')), false)
  assert.equal(isTrustedLocalRequest(request('POST', 'http://evil.test:3080', 'evil.test:3080')), false)
  assert.equal(isTrustedLocalRequest(request('POST', undefined)), false)
  assert.equal(isTrustedLocalRequest(request('POST', 'http://127.0.0.1:3080', '127.0.0.1:3080', 'cross-site')), false)
})

test('无 Origin 的本机只读诊断仍可查询状态', () => {
  assert.equal(isTrustedLocalRequest(request('GET', undefined)), true)
  assert.equal(isTrustedLocalRequest(request('HEAD', undefined)), true)
})
