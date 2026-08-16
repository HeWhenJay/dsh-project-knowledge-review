import type { RagQueryPayload, VideoImportPayload } from './types.js';
export interface RagClientConfig {
    ragBaseUrl: string;
    authorizationToken: string;
    requestTimeoutMs: number;
}
export declare function searchProjectKnowledge(config: RagClientConfig, question: string, topK?: number): Promise<RagQueryPayload>;
export declare function importProjectVideo(config: RagClientConfig, url: string, highPrecision?: boolean): Promise<VideoImportPayload>;
