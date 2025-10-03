import { AIConfig } from "./ai-config";
import { ErrorCode } from "./errors";

export interface GeneratedClues {
    figureName: string;
    aliases: string[];
    clues: string[];
    summary: string;
}

export class AIServiceError extends Error {
    code = ErrorCode.AI_SERVICE_ERROR.toString();
    retryable = false;
    constructor(message: string, code?: string, retryable?: boolean) {
        super(message);
        if (code) this.code = code;
        if (retryable !== undefined) this.retryable = retryable;
    }
}

/**
 * AI服务类 - 负责生成游戏线索
 */
export class AIService {
    private provider: "openai" | "gemini" = "openai";
    private maxRetries = 3;
    private retryDelay = 1000;

    constructor(provider?: "openai" | "gemini") {
        if (provider && AIConfig.providers[provider]) {
            this.provider = provider;
        }
    }

    /**
     * 生成历史人物的线索
     */
    async generateClues(
        figureName: string,
        difficulty: "EASY" | "NORMAL" | "HARD",
        wikiContext: string,
        sourceURL: string
    ): Promise<GeneratedClues> {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const prompt = this.buildPrompt(
                    figureName,
                    difficulty,
                    wikiContext,
                    sourceURL
                );
                const response = await this.callAIProvider(prompt);

                // 解析AI响应
                const result = this.parseAIResponse(response);

                // 验证结果
                this.validateGeneratedClues(result, figureName);
                // console.debug("AI生成线索成功:", result);
                return result;
            } catch (error) {
                console.error(
                    `AI服务调用失败 (尝试 ${attempt}/${this.maxRetries}):`,
                    error
                );

                if (attempt === this.maxRetries) {
                    throw this.createAIServiceError(
                        "AI服务暂时不可用，请稍后再试。",
                        "AI_SERVICE_UNAVAILABLE",
                        true
                    );
                }

                // 等待后重试
                await new Promise((resolve) =>
                    setTimeout(resolve, this.retryDelay * attempt)
                );
            }
        }

        throw this.createAIServiceError(
            "AI服务调用失败",
            "AI_SERVICE_ERROR",
            true
        );
    }

    /**
     * 构建提示词
     */
    private buildPrompt(
        figureName: string,
        difficulty: "EASY" | "NORMAL" | "HARD",
        wikiContext: string,
        sourceURL: string
    ): string {
        const promptTemplate = AIConfig.prompts.generateClues;

        return promptTemplate
            .replace(/{figureName}/g, figureName)
            .replace(/{difficulty}/g, difficulty)
            .replace(/{wiki_context}/g, wikiContext)
            .replace(/{sourceURL}/g, sourceURL);
    }

    /**
     * 调用AI提供商
     */
    private async callAIProvider(prompt: string): Promise<string> {
        const config = AIConfig.providers[this.provider];

        if (!config.apiKey) {
            throw this.createAIServiceError(
                `未配置${this.provider} API密钥`,
                "API_KEY_MISSING",
                false
            );
        }

        switch (this.provider) {
            case "openai":
                return await this.callOpenAI(prompt, config);
            case "gemini":
                return await this.callGemini(prompt, config);
            default:
                throw this.createAIServiceError(
                    `不支持的AI提供商: ${this.provider}`,
                    "UNSUPPORTED_PROVIDER",
                    false
                );
        }
    }

    /**
     * 调用OpenAI API
     */
    private async callOpenAI(prompt: string, config: any): Promise<string> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature,
            }),
        });
        // console.debug("OpenAI API响应状态:", JSON.stringify(response));
        if (!response.ok) {
            throw this.createAIServiceError(
                `OpenAI API错误: ${response.statusText}`,
                "OPENAI_API_ERROR",
                response.status >= 500 // 服务器错误可重试
            );
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    }

    /**
     * 调用Gemini API
     */
    private async callGemini(prompt: string, config: any): Promise<string> {
        const response = await fetch(
            `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: config.temperature,
                        maxOutputTokens: config.maxTokens,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw this.createAIServiceError(
                `Gemini API错误: ${response.statusText}`,
                "GEMINI_API_ERROR",
                response.status >= 500 // 服务器错误可重试
            );
        }

        const data = await response.json();
        // console.debug("Gemini API响应数据:", JSON.stringify(data));
        return data.candidates[0]?.content?.parts[0]?.text || "";
    }

    /**
     * 解析AI响应
     */
    private parseAIResponse(response: string): GeneratedClues {
        try {
            // 尝试从响应中提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI响应中未找到有效的JSON数据");
            }

            const parsed = JSON.parse(jsonMatch[0]) as GeneratedClues;

            // 基本验证
            if (
                !parsed.figureName ||
                !Array.isArray(parsed.clues) ||
                parsed.clues.length !== 10 ||
                !parsed.summary
            ) {
                throw new Error("AI响应格式不正确");
            }

            return parsed;
        } catch (error) {
            console.error("解析AI响应失败:", error);
            console.error("原始响应:", response);
            throw this.createAIServiceError(
                "AI响应格式不正确",
                "INVALID_RESPONSE_FORMAT",
                true
            );
        }
    }

    /**
     * 验证生成的线索
     */
    private validateGeneratedClues(
        result: GeneratedClues,
        expectedFigureName: string
    ): void {
        // 验证人物名称匹配
        if (result.figureName !== expectedFigureName) {
            throw this.createAIServiceError(
                "AI生成的人物名称不匹配",
                "FIGURE_NAME_MISMATCH",
                true
            );
        }

        // 验证线索数量
        if (result.clues.length !== 10) {
            throw this.createAIServiceError(
                `线索数量不正确，期望10条，实际${result.clues.length}条`,
                "INVALID_CLUE_COUNT",
                true
            );
        }

        // 验证线索内容
        result.clues.forEach((clue, index) => {
            if (!clue || clue.trim().length === 0) {
                throw this.createAIServiceError(
                    `第${index + 1}条线索为空`,
                    "EMPTY_CLUE",
                    true
                );
            }

            // 检查是否意外包含了人物姓名
            const normalizedClue = clue.toLowerCase();
            const normalizedName = expectedFigureName.toLowerCase();
            if (normalizedClue.includes(normalizedName)) {
                throw this.createAIServiceError(
                    `线索中意外包含了人物姓名: "${clue}"`,
                    "NAME_LEAKED_IN_CLUE",
                    true
                );
            }
        });
    }

    /**
     * 创建AI服务错误
     */
    private createAIServiceError(
        message: string,
        code: string,
        retryable: boolean
    ): AIServiceError {
        return new AIServiceError(message, code, retryable);
    }

    /**
     * 设置AI提供商
     */
    setProvider(provider: "openai" | "gemini"): void {
        if (!AIConfig.providers[provider]) {
            throw new Error(`不支持的AI提供商: ${provider}`);
        }
        this.provider = provider;
    }

    /**
     * 获取当前提供商配置
     */
    getProviderConfig() {
        return AIConfig.providers[this.provider];
    }
}

// 导出默认实例
export const aiService = new AIService();
