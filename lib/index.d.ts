import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "project-knowledge-review";
export declare const inject: string[];
export interface Config {
    /** 项目本机 RAG API 根地址；插件不携带登录令牌。 */
    ragBaseUrl: string;
    /** 系统提示词中展示的项目名称。 */
    projectName: string;
    /** 单次 RAG HTTP 请求的超时毫秒数。 */
    requestTimeoutMs: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
