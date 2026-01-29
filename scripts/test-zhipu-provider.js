/**
 * 直接测试 ZhipuProvider
 */
const { ZhipuProvider } = require('../src/lib/ai/zhipu-provider');
require('dotenv').config();

async function testZhipuProvider() {
    console.log("=== 直接测试 ZhipuProvider ===\n");
    
    const apiKey = process.env.ZHIPU_API_KEY;
    const model = process.env.ZHIPU_MODEL || 'glm-4v-flash';
    const baseUrl = process.env.ZHIPU_BASE_URL;
    
    console.log("配置:");
    console.log("- API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "未设置");
    console.log("- Model:", model);
    console.log("- Base URL:", baseUrl || "默认");
    console.log();
    
    if (!apiKey) {
        console.error("❌ 错误: ZHIPU_API_KEY 未设置");
        return;
    }
    
    const provider = new ZhipuProvider({ apiKey, baseUrl, model });
    
    // 测试图片识别
    console.log("测试: 图片识别");
    console.log("-".repeat(50));
    
    const testImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    
    try {
        const result = await provider.analyzeImage(testImage, 'image/png', 'zh');
        console.log("✅ 成功!");
        console.log("\n结果:");
        console.log("- 题目:", result.questionText);
        console.log("- 答案:", result.answerText);
        console.log("- 解析:", result.analysis);
        console.log("- 学科:", result.subject);
        console.log("- 知识点:", result.knowledgePoints);
    } catch (error) {
        console.error("❌ 失败!");
        console.error("\n错误信息:");
        console.error("- Message:", error.message);
        console.error("- Stack:", error.stack);
    }
    
    console.log("\n=== 测试完成 ===");
}

testZhipuProvider().catch(console.error);