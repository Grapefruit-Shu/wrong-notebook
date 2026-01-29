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

async function testOpenAISDK() {
    console.log("=== 测试 OpenAI SDK 调用智谱AI ===");
    console.log("API Key:", apiKey.substring(0, 10) + "...");
    console.log("Base URL:", baseURL);
    console.log("Model:", model);
    console.log();

    try {
        console.log("发送请求...");
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
            max_tokens: 100
        });

        console.log("✅ 请求成功!");
        console.log("响应:", JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("❌ 请求失败!");
        console.error("错误:", error.message);
        console.error("错误类型:", error.constructor?.name);
        console.error("错误状态码:", error.status);
        console.error("错误堆栈:", error.stack);
        
        if (error.response) {
            console.error("响应数据:", error.response);
        }
    }
}

testOpenAISDK().catch(console.error);
