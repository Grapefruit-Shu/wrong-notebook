/**
 * 智谱AI接口测试脚本
 * 用于诊断API调用问题
 */
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testZhipuAI() {
    console.log("=== 智谱AI API 测试 ===\n");
    
    const apiKey = process.env.ZHIPU_API_KEY;
    const model = process.env.ZHIPU_MODEL || "glm-4v-flash";
    const baseUrl = process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
    
    console.log("配置信息:");
    console.log("- API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "未设置");
    console.log("- Model:", model);
    console.log("- Base URL:", baseUrl);
    console.log("- API Key 格式:", apiKey?.includes('.') ? "id.secret (正确)" : "普通格式 (可能不正确)");
    console.log();
    
    if (!apiKey) {
        console.error("❌ 错误: ZHIPU_API_KEY 未设置");
        return;
    }
    
    // 测试1: 使用原生fetch测试
    console.log("测试1: 使用原生fetch测试智谱AI API");
    console.log("-".repeat(50));
    
    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: "你好，请简单介绍一下你自己"
                    }
                ],
                max_tokens: 100
            })
        });
        
        console.log("响应状态:", response.status, response.statusText);
        
        const responseText = await response.text();
        console.log("响应内容:", responseText);
        
        if (response.ok) {
            console.log("✅ 测试1成功!");
        } else {
            console.log("❌ 测试1失败!");
        }
    } catch (error) {
        console.error("❌ 测试1异常:", error.message);
    }
    
    console.log();
    
    // 测试2: 测试图片识别
    console.log("测试2: 测试图片识别功能");
    console.log("-".repeat(50));
    
    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
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
            })
        });
        
        console.log("响应状态:", response.status, response.statusText);
        
        const responseText = await response.text();
        console.log("响应内容:", responseText);
        
        if (response.ok) {
            console.log("✅ 测试2成功!");
        } else {
            console.log("❌ 测试2失败!");
        }
    } catch (error) {
        console.error("❌ 测试2异常:", error.message);
    }
    
    console.log();
    console.log("=== 测试完成 ===");
}

testZhipuAI().catch(console.error);