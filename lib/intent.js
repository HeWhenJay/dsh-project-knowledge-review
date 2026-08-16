const INVENTORY_PATTERNS = [
    /知识库.*(有|包含|内容|资料|标题|来源|存储|位置|路径|范围|共享|共用|多少|数量|清单|列表)/i,
    /(有哪些|查看|列出|展示|浏览|多少).*(知识|资料|文档)/i,
    /(存储在哪里|保存在哪里|是否.*共用|是否.*共享|作用域|存过什么|喂给你.*还有吗|库.*多大|资料.*(工程|项目|全局)|之前.*(保存|收录)|已收录)/i,
];
const IMPORT_PATTERNS = [/(添加|导入|写入|收录|学习).*(资料|文本|图片|音频|视频|知识库)/i];
/** 将知识问答、知识库管理查询和导入意图分流，避免清单问题误走 evidence 拒答链。 */
export function classifyKnowledgeIntent(text) {
    const normalized = text.trim();
    if (!normalized)
        return 'other';
    if (INVENTORY_PATTERNS.some((pattern) => pattern.test(normalized)))
        return 'knowledge-inventory';
    if (IMPORT_PATTERNS.some((pattern) => pattern.test(normalized)))
        return 'knowledge-import';
    return 'knowledge-question';
}
