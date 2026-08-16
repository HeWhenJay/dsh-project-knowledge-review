export interface Evidence {
    documentTitle?: string;
    sectionTitle?: string;
    source?: string;
    score?: number;
    snippet?: string;
}
export interface RagQueryPayload {
    code?: number;
    msg?: string;
    data?: {
        answer?: string;
        answerStatus?: 'ANSWERED' | 'REFUSED';
        refusalReason?: string | null;
        refusalMessage?: string | null;
        confidence?: number;
        evidences?: Evidence[];
    };
}
export interface RagOverviewPayload {
    code?: number;
    msg?: string;
    data?: {
        materialCount?: number;
        chunkCount?: number;
        evidenceCount?: number;
        lastIndexedTitle?: string | null;
    };
}
export interface RagMaterialItem {
    id: number;
    title: string;
    source?: string | null;
    status?: string;
    documentType?: string;
    chunkCount?: number;
    createdAt?: string | null;
    updatedAt?: string | null;
}
export interface RagMaterialPagePayload {
    code?: number;
    msg?: string;
    data?: {
        items?: RagMaterialItem[];
        nextCursor?: string | null;
        hasMore?: boolean;
        total?: number;
    };
}
export interface RagMaterialPreviewPayload {
    code?: number;
    msg?: string;
    data?: {
        materialId?: number;
        title?: string;
        source?: string | null;
        contentType?: string;
        content?: string;
    };
}
export interface VideoImportPayload {
    code?: number;
    msg?: string;
    data?: {
        id?: number;
        title?: string;
        status?: string;
    };
}
