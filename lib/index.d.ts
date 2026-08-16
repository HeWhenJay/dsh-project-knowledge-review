import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "project-knowledge-review";
export declare const inject: string[];
export interface Config {
    /** 默认 local：零配置本地检索；project-rag：连接完整项目 RAG。 */
    mode: 'local' | 'project-rag';
    /** 本地 JSON 知识库路径；默认位于用户目录，不写入项目工作区。 */
    localStorePath: string;
    /** 项目 RAG API 根地址，仅 project-rag 模式使用。 */
    ragBaseUrl: string;
    /** 系统提示词中展示的知识库名称。 */
    projectName: string;
    /** 单次项目 RAG HTTP 请求的超时毫秒数。 */
    requestTimeoutMs: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
