export type KnowledgeIntent = 'knowledge-question' | 'knowledge-inventory' | 'knowledge-import' | 'other';
/** 将知识问答、知识库管理查询和导入意图分流，避免清单问题误走 evidence 拒答链。 */
export declare function classifyKnowledgeIntent(text: string): KnowledgeIntent;
