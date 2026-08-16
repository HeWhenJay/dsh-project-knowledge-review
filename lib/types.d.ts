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
export interface VideoImportPayload {
    code?: number;
    msg?: string;
    data?: {
        id?: number;
        title?: string;
        status?: string;
    };
}
