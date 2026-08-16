import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage } from 'node:http';
import { type KnowledgeSettings } from './settings.js';
/** 注册独立插件的本机设置、资料浏览、摘要和分类桥接。 */
export declare function registerSettingsBridge(ctx: Context, current: () => KnowledgeSettings): void;
export declare function isTrustedLocalRequest(req: IncomingMessage): boolean;
