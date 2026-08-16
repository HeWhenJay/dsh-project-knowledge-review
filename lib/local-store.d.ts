export interface LocalKnowledgeDocument {
    id: string;
    title: string;
    source: string;
    content: string;
    createdAt: string;
}
export interface LocalEvidence {
    documentTitle: string;
    source: string;
    snippet: string;
    score: number;
}
/** 将用户目录快捷写法解析为实际本地资料库路径。 */
export declare function resolveLocalStorePath(configuredPath: string): string;
/** 从中文、英文和技术标识中提取可用于零配置词法检索的 token。 */
export declare function tokenize(text: string): string[];
/** 将纯文本资料持久化到插件本地 JSON 知识库，不依赖数据库、向量或 API Key。 */
export declare function addLocalDocument(path: string, title: string, content: string, source?: string): Promise<LocalKnowledgeDocument>;
/** 使用 BM25 风格的词项覆盖率检索本地资料，并返回可追溯文本片段。 */
export declare function searchLocalKnowledge(path: string, question: string, topK: number): Promise<LocalEvidence[]>;
/** 返回本地知识库概览，供用户确认资料是否已真正写入。 */
export declare function localKnowledgeOverview(path: string): Promise<{
    documentCount: number;
    storePath: string;
}>;
