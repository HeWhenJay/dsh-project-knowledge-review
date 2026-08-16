export declare const SETTINGS_ENDPOINT = "/api/project-knowledge-review/settings";
export interface KnowledgeSettingsView {
    enabled: boolean;
    mode: 'local' | 'project-rag';
    localStorePath: string;
    projectName: string;
    ragBaseUrl: string;
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
export interface SettingsEnvelope {
    ok: boolean;
    value?: KnowledgeSettingsView;
    revision?: number;
    writable?: boolean;
    message?: string;
}
