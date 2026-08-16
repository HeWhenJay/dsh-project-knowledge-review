export interface MediaServiceConfig {
    baseUrl: string;
    model: string;
    apiKey?: string;
    timeoutMs: number;
}
/** 使用 OpenAI 兼容视觉接口识别图片文字。 */
export declare function recognizeImageUrl(config: MediaServiceConfig, imageUrl: string): Promise<string>;
/** 使用 OpenAI 兼容 audio/transcriptions 接口转写可直接下载的音频 URL。 */
export declare function transcribeAudioUrl(config: MediaServiceConfig, audioUrl: string): Promise<string>;
