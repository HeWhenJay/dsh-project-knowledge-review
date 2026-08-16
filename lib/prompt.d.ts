import type { KnowledgeSettings } from './settings.js';
export declare const PROJECT_KNOWLEDGE_REVIEW_PROMPT_ORDER = 25;
export declare function buildProjectKnowledgeReviewPrompt(settings: Pick<KnowledgeSettings, 'projectName' | 'mode' | 'answerPolicy' | 'ocrEnabled' | 'asrEnabled'>): string;
