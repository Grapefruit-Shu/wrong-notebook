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

async function testSimplifiedPrompt() {
    console.log("=== 测试简化后的 systemPrompt ===");
    console.log("API Key:", apiKey.substring(0, 10) + "...");
    console.log("Base URL:", baseURL);
    console.log("Model:", model);
    console.log();

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

    try {
        console.log("发送请求...");
        const response = await openai.chat.completions.create({
            model: model,
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
                                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1024
        });

        console.log("✅ 请求成功!");
        console.log("使用的 tokens:", response.usage?.total_tokens);
        console.log("响应长度:", response.choices[0]?.message?.content?.length);
        console.log();
        console.log("=== 响应内容 ===");
        console.log(response.choices[0]?.message?.content);
        console.log();
        console.log("=== 响应结束 ===");
    } catch (error) {
        console.error("❌ 请求失败!");
        console.error("错误:", error.message);
        console.error("错误码:", error.code);
    }
}

testSimplifiedPrompt().catch(console.error);
