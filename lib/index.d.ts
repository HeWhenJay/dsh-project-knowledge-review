import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "project-knowledge-review";
export declare const inject: string[];
export interface Config {
    /** 项目 RAG 公共 API 根地址。 */
    ragBaseUrl: string;
    /** 系统提示词中展示的项目名称。 */
    projectName: string;
    /** 项目登录会话的 Bearer Token；留空时仅安全拒答。 */
    authorizationToken: string;
    /** 单次 RAG HTTP 请求的超时毫秒数。 */
    requestTimeoutMs: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
