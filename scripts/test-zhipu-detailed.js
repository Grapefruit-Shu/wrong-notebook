/**
 * 详细的智谱AI测试
 */
const dotenv = require('dotenv');
dotenv.config();

async function testZhipuAI() {
    console.log("=== 智谱AI 详细测试 ===\n");
    
    const apiKey = process.env.ZHIPU_API_KEY;
    const model = process.env.ZHIPU_MODEL || 'glm-4v-flash';
    const baseUrl = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
    
    console.log("配置信息:");
    console.log("- API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "未设置");
    console.log("- Model:", model);
    console.log("- Base URL:", baseUrl);
    console.log();
    
    if (!apiKey) {
        console.error("❌ 错误: ZHIPU_API_KEY 未设置");
        return;
    }
    
    // 测试1: 简单文本对话
    console.log("测试1: 简单文本对话");
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
        console.log("响应内容:", responseText.substring(0, 500));
        
        if (response.ok) {
            console.log("✅ 测试1成功!");
        } else {
            console.log("❌ 测试1失败!");
        }
    } catch (error) {
        console.error("❌ 测试1异常:", error.message);
    }
    
    console.log();
    
    // 测试2: 图片识别（使用真实的图片数据）
    console.log("测试2: 图片识别");
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
        console.log("响应内容:", responseText.substring(0, 500));
        
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