import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage } from 'node:http';
import { type KnowledgeSettings } from './settings.js';
/** 为 rc.6 的第三方 namespace 白名单限制提供仅回环设置与知识浏览桥接。 */
export declare function registerSettingsBridge(ctx: Context, current: () => KnowledgeSettings): void;
export declare function isTrustedLocalRequest(req: IncomingMessage): boolean;
