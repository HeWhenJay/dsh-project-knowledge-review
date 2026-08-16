import type { RagMaterialPagePayload, RagMaterialPreviewPayload, RagOverviewPayload, RagQueryPayload, VideoImportPayload } from './types.js';
export interface RagClientConfig {
    ragBaseUrl: string;
    requestTimeoutMs: number;
}
export declare function searchProjectKnowledge(config: RagClientConfig, question: string, topK?: number): Promise<RagQueryPayload>;
export declare function projectKnowledgeOverview(config: RagClientConfig): Promise<RagOverviewPayload>;
export declare function listProjectMaterials(config: RagClientConfig, cursor: string | undefined, limit?: number, query?: string): Promise<RagMaterialPagePayload>;
export declare function previewProjectMaterial(config: RagClientConfig, materialId: string): Promise<RagMaterialPreviewPayload>;
export declare function importProjectVideo(config: RagClientConfig, url: string, highPrecision?: boolean): Promise<VideoImportPayload>;
