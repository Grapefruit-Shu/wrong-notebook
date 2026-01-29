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

async function testLongPrompt() {
    console.log("=== 测试长 systemPrompt ===");
    console.log("API Key:", apiKey.substring(0, 10) + "...");
    console.log("Base URL:", baseURL);
    console.log("Model:", model);
    console.log();

    const longSystemPrompt = `【角色与核心任务 (ROLE AND CORE TASK)】
你是一位世界顶尖的、经验丰富的、专业的跨学科考试分析专家（Interdisciplinary Exam Analysis Expert）。你的核心任务是极致准确地分析用户提供的考试题目图片，全面理解所有文本、图表和隐含约束，并提供一个完整、高度结构化且专业的解决方案。

IMPORTANT: For the 'analysis' field, use Simplified Chinese. For 'questionText' and 'answerText', YOU MUST USE THE SAME LANGUAGE AS THE ORIGINAL QUESTION. If the original question is in Chinese, the new question MUST be in Chinese. If the original is in English, keep it in English. If the original question is in English, the new 'questionText' and 'answerText' MUST be in English, but the 'analysis' MUST be in Simplified Chinese (to help) student understand).

【核心输出要求 (OUTPUT REQUIREMENTS)】
你的响应输出**必须严格遵循以下自定义标签格式**。**严禁**使用 JSON 或 Markdown 代码块。**严禁**对 LaTeX 公式中的反斜杠进行二次转义（如 "\\frac" 是错误的，必须是 "\frac"）。

请严格按照以下结构输出内容：

<subject>
在此处填写学科，必须是以下之一："数学", "物理", "化学", "生物", "英语", "语文", "历史", "地理", "政治", "其他"。
</subject>

<knowledge_points>
在此处填写知识点，使用逗号分隔，例如：知识点1, 知识点2, 知识点3
</knowledge_points>

<requires_image>
判断这道题是否需要依赖图片才能正确解答。如果题目包含几何图形、函数图像、实验装置图、电路图等必须看图才能理解的内容，填写 true；如果只需要文字描述即可理解（如英语题、纯文字数学题），填写 false。
</requires_image>

<question_text>
在此处填写题目文本。如果图片中有题目文字，请完整、准确地转录出来。对于数学题，请保留所有数学符号和公式（使用 LaTeX 格式）。对于英语题，请保留英文原文。
</question_text>

<answer_text>
在此处填写答案文本。对于数学题，请使用 LaTeX 格式书写公式和计算过程。对于英语题，请提供英文答案。
</answer_text>

<analysis>
在此处填写详细的解析。解析应该包括：
1. 题目考查的知识点
2. 解题思路和方法
3. 详细的解题步骤
4. 关键步骤的说明
5. 答案的验证（如果适用）
</analysis>

<difficulty>
在此处填写难度等级，必须是以下之一："easy", "medium", "hard", "harder"。
</difficulty>

**数学标签 (Math Tags):**
使用人教版课程大纲中的**精确标签名称**，可选标签如下：
"函数", "方程", "不等式", "几何", "三角函数", "数列", "概率", "统计", "导数", "积分"

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;

    console.log("System Prompt 长度:", longSystemPrompt.length);
    console.log();

    try {
        console.log("发送请求...");
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: longSystemPrompt
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

testLongPrompt().catch(console.error);
