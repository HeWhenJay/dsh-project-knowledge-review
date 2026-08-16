import Schema from '@deepseek-ai/schemastery';
export declare const KNOWLEDGE_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
export declare const OCR_API_KEY_REF = "DSH_KNOWLEDGE_OCR_API_KEY";
export declare const ASR_API_KEY_REF = "DSH_KNOWLEDGE_ASR_API_KEY";
export interface KnowledgeSettings {
    enabled: boolean;
    answerPolicy: 'strict' | 'reference';
    localStorePath: string;
    projectName: string;
    requestTimeoutMs: number;
    ocrEnabled: boolean;
    ocrBaseUrl: string;
    ocrModel: string;
    ocrApiKeyEnv: string;
    asrEnabled: boolean;
    asrBaseUrl: string;
    asrModel: string;
    asrApiKeyEnv: string;
}
export declare const KnowledgeSettingsSchema: Schema<KnowledgeSettings>;
export declare function validateKnowledgeSettings(settings: KnowledgeSettings): void;
