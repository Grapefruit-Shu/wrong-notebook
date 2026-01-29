const OpenAI = require("openai");

const apiKey = "81ffdc81c83b4c47b8629acf5f060714.ZHEIg2jaw7oa3rMJ";
const baseURL = "https://open.bigmodel.cn/api/paas/v4";
const model = "glm-4v-flash";

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
    timeout: 180000,
    maxRetries: 2,
});

async function testMaxTokens() {
    console.log("=== 测试不同的 max_tokens 值 ===");
    console.log("API Key:", apiKey.substring(0, 10) + "...");
    console.log("Base URL:", baseURL);
    console.log("Model:", model);
    console.log();

    const testValues = [8192, 4096, 2048, 1024, 512, 100];

    for (const maxTokens of testValues) {
        console.log(`测试 max_tokens = ${maxTokens}`);
        console.log("-".repeat(50));

        try {
            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的错题分析助手。"
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "请描述这张图片"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                                }
                            }
                        ]
                    }
                ],
                max_tokens: maxTokens
            });

            console.log("✅ 成功!");
            console.log("使用的 tokens:", response.usage?.total_tokens);
            console.log();
        } catch (error) {
            console.error("❌ 失败!");
            console.error("错误:", error.message);
            console.error("错误码:", error.code);
            console.error();
        }
    }

    console.log("=== 测试完成 ===");
}

testMaxTokens().catch(console.error);
