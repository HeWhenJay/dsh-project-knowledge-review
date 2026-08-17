export interface LocalKnowledgeDocument {
    id: string;
    title: string;
    source: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    summary?: string;
    summarySource?: 'extractive' | 'model';
    systemCategory?: string;
    userCategory?: string | null;
}
export interface LocalEvidence {
    documentTitle: string;
    source: string;
    snippet: string;
    score: number;
}
export interface LocalKnowledgeDocumentSummary {
    id: string;
    title: string;
    source: string;
    createdAt: string;
    updatedAt?: string;
    contentLength: number;
    summary?: string;
    summarySource?: 'extractive' | 'model';
    systemCategory?: string;
    userCategory?: string | null;
}
export interface LocalKnowledgeDocumentPage {
    items: LocalKnowledgeDocumentSummary[];
    nextCursor?: string;
    hasMore: boolean;
    total: number;
}
/** 将用户目录快捷写法解析为实际本地资料库路径。 */
export declare function resolveLocalStorePath(configuredPath: string): string;
/** 从中文、英文和技术标识中提取可用于零配置词法检索的 token。 */
export declare function tokenize(text: string): string[];
/** 将纯文本资料持久化到零配置本地库，journal 保证中断后可自动补偿。 */
export declare function addLocalDocument(path: string, title: string, content: string, source?: string): Promise<LocalKnowledgeDocument>;
/** 先扫描轻量 token 索引选出有限候选，再按需读取候选原文生成 evidence。 */
export declare function searchLocalKnowledge(path: string, question: string, topK: number): Promise<LocalEvidence[]>;
/** 返回本地知识库概览，只读取常数大小清单。 */
export declare function localKnowledgeOverview(path: string): Promise<{
    documentCount: number;
    storePath: string;
    scope: 'dsh-user-global';
}>;
/** 流式分页返回元数据，内存仅保留当前页；原文不进入列表请求。 */
export declare function listLocalDocuments(path: string, cursor: string | undefined, limit: number, query?: string): Promise<LocalKnowledgeDocumentPage>;
/** 分页读取摘要工作区元数据，并按系统分类或用户二次分类过滤。 */
export declare function listLocalSummaries(path: string, cursor: string | undefined, limit: number, query?: string, systemCategory?: string, userCategory?: string | undefined): Promise<LocalKnowledgeDocumentPage & {
    systemCategoryCounts: Record<string, number>;
    userCategoryCounts: Record<string, number>;
    userCategories: string[];
}>;
/** 创建用户二次分类；空分类也独立持久化，便于先建目录再整理资料。 */
export declare function createLocalUserCategory(path: string, name: string): Promise<string[]>;
/** 替换一份本地资料正文并原子重建摘要、分类和检索索引。 */
export declare function replaceLocalDocumentContent(path: string, id: string, content: string, summary?: string): Promise<LocalKnowledgeDocument>;
/** 更新本地摘要、摘要来源、系统初分类或用户二次分类。 */
export declare function updateLocalDocumentMetadata(path: string, id: string, patch: {
    summary?: string;
    summarySource?: 'extractive' | 'model';
    systemCategory?: string;
    userCategory?: string | null;
}): Promise<LocalKnowledgeDocument>;
/** 单条原文文件名由 ID 哈希直接推导，展开无需扫描整个索引。 */
export declare function getLocalDocument(path: string, id: string): Promise<LocalKnowledgeDocument | undefined>;
/** 复用当前项目的 Markdown 摘要规范：保留标题、列表、表格和代码块结构。 */
export declare function normalizeMarkdownSummary(value: string): string;
