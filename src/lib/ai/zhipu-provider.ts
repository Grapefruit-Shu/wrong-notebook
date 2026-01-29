import OpenAI from "openai";
import { AIService, ParsedQuestion, DifficultyLevel, AIConfig } from "./types";
import { generateSimilarQuestionPrompt } from './prompts';
import { getAppConfig } from '../config';
import { validateParsedQuestion, safeParseParsedQuestion } from './schema';
import { createLogger } from '../logger';

const logger = createLogger('ai:zhipu');

// 智谱AI默认配置
const ZHIPU_DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_DEFAULT_MODEL = 'glm-4v'; // 支持视觉的模型

export class ZhipuProvider implements AIService {
    private openai: OpenAI;
    private model: string;
    private baseURL: string;

    constructor(config?: AIConfig) {
        const apiKey = config?.apiKey;
        const baseURL = config?.baseUrl;

        if (!apiKey) {
            throw new Error("AI_AUTH_ERROR: ZHIPU_API_KEY is required for Zhipu provider");
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL || ZHIPU_DEFAULT_BASE_URL,
            dangerouslyAllowBrowser: true,
            timeout: 180000,
            maxRetries: 2,
        });

        this.model = config?.model || ZHIPU_DEFAULT_MODEL;
        this.baseURL = baseURL || ZHIPU_DEFAULT_BASE_URL;

        logger.info({
            provider: 'Zhipu AI',
            model: this.model,
            baseURL: this.baseURL,
            apiKeyPrefix: apiKey.substring(0, 8) + '...'
        }, 'Zhipu AI Provider initialized');
    }

    private extractTag(text: string, tagName: string): string | null {
        const startTag = `<${tagName}>`;
        const endTag = `</${tagName}>`;
        const startIndex = text.indexOf(startTag);

        if (startIndex === -1) {
            return null;
        }

        const contentStartIndex = startIndex + startTag.length;
        let endIndex = text.lastIndexOf(endTag);

        // 特殊处理：如果闭合标签丢失（通常主要发生在最后的 analysis 标签被截断时）
        if (endIndex === -1 && tagName === 'analysis') {
            logger.warn({ tagName }, 'Tag was verified unclosed, treating as truncated and reading to end');
            return text.substring(contentStartIndex).trim();
        }

        if (endIndex === -1 || contentStartIndex >= endIndex) {
            return null;
        }

        return text.substring(contentStartIndex, endIndex).trim();
    }

    private parseResponse(text: string): ParsedQuestion {
        logger.debug({ textLength: text.length }, 'Parsing AI response');

        const questionText = this.extractTag(text, "question_text");
        const answerText = this.extractTag(text, "answer_text");
        const analysis = this.extractTag(text, "analysis");
        const subjectRaw = this.extractTag(text, "subject");
        const knowledgePointsRaw = this.extractTag(text, "knowledge_points");
        const requiresImageRaw = this.extractTag(text, "requires_image");

        // Basic Validation
        if (!questionText || !answerText || !analysis) {
            logger.error({ rawTextSample: text.substring(0, 500) }, 'Missing critical XML tags');
            throw new Error("Invalid AI response: Missing critical XML tags (<question_text>, <answer_text>, or <analysis>)");
        }

        // Process Subject
        let subject: ParsedQuestion['subject'] = '其他';
        const validSubjects = ["数学", "物理", "化学", "生物", "英语", "语文", "历史", "地理", "政治", "其他"];
        if (subjectRaw && validSubjects.includes(subjectRaw)) {
            subject = subjectRaw as any;
        }

        // Process Knowledge Points
        let knowledgePoints: string[] = [];
        if (knowledgePointsRaw) {
            knowledgePoints = knowledgePointsRaw.split(/[,，\n]/).map(k => k.trim()).filter(k => k.length > 0);
        }

        // Process requiresImage (default to false if not present or unrecognized)
        const requiresImage = requiresImageRaw?.toLowerCase().trim() === 'true';

        // Construct Result
        const result: ParsedQuestion = {
            questionText,
            answerText,
            analysis,
            subject,
            knowledgePoints,
            requiresImage
        };

        // Final Schema Validation
        const validation = safeParseParsedQuestion(result);
        if (validation.success) {
            logger.debug('Validated successfully via XML tags');
            return validation.data;
        } else {
            logger.warn({ validationError: validation.error.format() }, 'Schema validation warning');
            return result;
        }
    }

    async analyzeImage(imageBase64: string, mimeType: string = "image/jpeg", language: 'zh' | 'en' = 'zh', grade?: 7 | 8 | 9 | 10 | 11 | 12 | null, subject?: string | null): Promise<ParsedQuestion> {
        const config = getAppConfig();

        // 为智谱AI使用简化的prompt，避免prompt过长导致响应为空
        const systemPrompt = `你是一个专业的错题分析助手。请按照以下XML格式输出你的分析：

<subject>
学科（数学/物理/化学/生物/英语/语文/历史/地理/政治/其他）
</subject>

<knowledge_points>
知识点1, 知识点2
</knowledge_points>

<requires_image>
true 或 false
</requires_image>

<question_text>
题目文本
</question_text>

<answer_text>
答案文本
</answer_text>

<analysis>
详细解析（使用简体中文）
</analysis>

<difficulty>
easy 或 medium 或 hard 或 harder
</difficulty>`;

        logger.box('🔍 Zhipu AI Image Analysis Request', {
            provider: 'Zhipu AI',
            endpoint: `${this.baseURL}/chat/completions`,
            imageSize: `${imageBase64.length} bytes`,
            mimeType,
            model: this.model,
            language,
            grade: grade || 'all'
        });
        logger.box('📝 Full System Prompt', systemPrompt);

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "请分析这张图片中的错题"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1024,
            });

            logger.box('📦 Full API Response', JSON.stringify(response, null, 2));

            // 检查响应是否有效
            if (!response || !response.choices || response.choices.length === 0) {
                logger.error({ response: JSON.stringify(response) }, 'Invalid API response - no choices array');
                throw new Error("AI_RESPONSE_ERROR: API returned empty or invalid response");
            }

            const text = response.choices[0]?.message?.content || "";

            logger.box('🤖 AI Raw Response', text);

            if (!text) throw new Error("Empty response from AI");
            const parsedResult = this.parseResponse(text);

            logger.box('✅ Parsed & Validated Result', JSON.stringify(parsedResult, null, 2));

            return parsedResult;

        } catch (error) {
            const errorObj = error as any;
            logger.box('❌ Error during AI analysis', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                errorType: typeof error,
                errorName: error instanceof Error ? error.name : undefined,
                errorConstructor: error instanceof Error ? error.constructor?.name : undefined,
                errorKeys: error instanceof Error ? Object.keys(error) : undefined,
                errorStatus: errorObj.status,
                errorCause: errorObj.cause,
                errorCode: errorObj.code,
                errorParam: errorObj.param,
                errorTypeField: errorObj.type,
                errorRequestID: errorObj.requestID
            });
            this.handleError(error);
            throw error;
        }
    }

    async generateSimilarQuestion(originalQuestion: string, knowledgePoints: string[], language: 'zh' | 'en' = 'zh', difficulty: DifficultyLevel = 'medium'): Promise<ParsedQuestion> {
        const config = getAppConfig();
        const systemPrompt = generateSimilarQuestionPrompt(language, originalQuestion, knowledgePoints, difficulty, {
            customTemplate: config.prompts?.similar
        });
        const userPrompt = `\nOriginal Question: "${originalQuestion}"\nKnowledge Points: ${knowledgePoints.join(", ")}\n    `;

        logger.box('🎯 Generate Similar Question Request', {
            provider: 'Zhipu AI',
            endpoint: `${this.baseURL}/chat/completions`,
            model: this.model,
            originalQuestion: originalQuestion.substring(0, 100) + '...',
            knowledgePoints: knowledgePoints.join(', '),
            difficulty,
            language
        });
        logger.box('📝 System Prompt', systemPrompt);
        logger.box('📝 User Prompt', userPrompt);

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 1024,
            });

            const text = response.choices[0]?.message?.content || "";

            logger.box('🤖 AI Raw Response', text);

            if (!text) throw new Error("Empty response from AI");
            const parsedResult = this.parseResponse(text);

            logger.box('✅ Parsed & Validated Result', JSON.stringify(parsedResult, null, 2));

            return parsedResult;

        } catch (error) {
            logger.box('❌ Error during question generation', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            this.handleError(error);
            throw error;
        }
    }

    async reanswerQuestion(questionText: string, language: 'zh' | 'en' = 'zh', subject?: string | null, imageBase64?: string): Promise<{ answerText: string; analysis: string; knowledgePoints: string[] }> {
        const { generateReanswerPrompt } = await import('./prompts');
        const prompt = generateReanswerPrompt(language, questionText, subject);

        logger.info({
            provider: 'Zhipu AI',
            endpoint: `${this.baseURL}/chat/completions`,
            model: this.model,
            questionLength: questionText.length,
            subject: subject || 'auto',
            hasImage: !!imageBase64
        }, 'Reanswer Question Request');
        logger.debug({ prompt }, 'Full prompt');

        try {
            // 根据是否有图片构建不同的消息内容
            let userContent: any = "请根据上述题目提供答案和解析。";
            if (imageBase64) {
                const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
                logger.debug({ imageLength: imageUrl.length }, 'Image added to request');
                userContent = [
                    { type: "text", text: "请结合图片和题目描述提供答案和解析。" },
                    { type: "image_url", image_url: { url: imageUrl } }
                ];
            } else {
                logger.debug({ imageBase64Type: typeof imageBase64, hasValue: !!imageBase64 }, 'No image data');
            }

            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: userContent }
                ],
                max_tokens: 1024,
            });

            logger.debug({ response: JSON.stringify(response) }, 'Full API response');

            // 检查响应是否有效
            if (!response || !response.choices || response.choices.length === 0) {
                logger.error({ response: JSON.stringify(response) }, 'Invalid API response - no choices array');
                throw new Error("AI_RESPONSE_ERROR: API returned empty or invalid response");
            }

            const text = response.choices[0]?.message?.content || "";

            logger.debug({ rawResponse: text }, 'AI raw response');

            if (!text) throw new Error("Empty response from AI");

            // 解析响应
            const answerText = this.extractTag(text, "answer_text") || "";
            const analysis = this.extractTag(text, "analysis") || "";
            const knowledgePointsRaw = this.extractTag(text, "knowledge_points") || "";
            const knowledgePoints = knowledgePointsRaw.split(/[,，\n]/).map(k => k.trim()).filter(k => k.length > 0);

            logger.info('Reanswer parsed successfully');

            return { answerText, analysis, knowledgePoints };

        } catch (error) {
            logger.error({ error, stack: error instanceof Error ? error.stack : undefined }, 'Error during reanswer');
            this.handleError(error);
            throw error;
        }
    }

    private handleError(error: unknown) {
        logger.error({ error }, 'Zhipu AI error');
        
        let errorMessage = '';
        let statusCode = 0;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // 检查 OpenAI SDK 错误对象的结构
            const errorObj = error as any;
            if (errorObj.status) {
                statusCode = errorObj.status;
            }
            if (errorObj.cause) {
                errorMessage = errorObj.cause.message || errorMessage;
            }
        }
        
        const msg = errorMessage.toLowerCase();
        
        // 首先检查状态码
        if (statusCode === 401 || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key') || msg.includes('token')) {
            throw new Error("AI_AUTH_ERROR");
        }
        if (statusCode === 403 || msg.includes('403') || msg.includes('forbidden') || msg.includes('permission')) {
            throw new Error("AI_PERMISSION_DENIED");
        }
        if (statusCode === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('does not exist')) {
            throw new Error("AI_NOT_FOUND");
        }
        if (statusCode === 429 || msg.includes('429') || msg.includes('rate limit') || msg.includes('too many') || msg.includes('quota') || msg.includes('额度')) {
            throw new Error("AI_QUOTA_EXCEEDED");
        }
        if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504 ||
            msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') ||
            msg.includes('无可用') || msg.includes('overloaded') || msg.includes('unavailable')) {
            throw new Error("AI_SERVICE_UNAVAILABLE");
        }
        
        // 然后检查消息内容
        if (msg.includes('fetch failed') || msg.includes('network') || msg.includes('connect') || msg.includes('enotfound') || msg.includes('econnrefused') || msg.includes('econnreset')) {
            throw new Error("AI_CONNECTION_FAILED");
        }
        if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted') || msg.includes('408')) {
            throw new Error("AI_TIMEOUT_ERROR");
        }
        if (msg.includes('invalid json') || msg.includes('parse')) {
            throw new Error("AI_RESPONSE_ERROR");
        }
        
        throw new Error("AI_UNKNOWN_ERROR");
    }
}
