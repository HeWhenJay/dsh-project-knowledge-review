import type { Context } from '@deepseek-ai/cordis';
import { type KnowledgeSettings } from './settings.js';
export declare const name = "project-knowledge-review";
export declare const inject: string[];
export declare const Config: import("@deepseek-ai/schemastery").default<KnowledgeSettings>;
export type Config = KnowledgeSettings;
export declare function apply(ctx: Context, config: Config): void;
