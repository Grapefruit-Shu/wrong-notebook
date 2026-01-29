/**
 * 测试智谱AI通过项目API
 */
async function testProjectAPI() {
    console.log("=== 测试项目API ===\n");
    
    const testData = {
        provider: 'zhipu',
        apiKey: process.env.ZHIPU_API_KEY,
        baseUrl: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
        model: process.env.ZHIPU_MODEL || 'glm-4v-flash',
        language: 'zh'
    };
    
    console.log("测试配置:");
    console.log("- Provider:", testData.provider);
    console.log("- Model:", testData.model);
    console.log("- API Key:", testData.apiKey ? `${testData.apiKey.substring(0, 8)}...` : "未设置");
    console.log();
    
    try {
        console.log("发送测试请求到 /api/ai/test ...");
        const response = await fetch('http://localhost:3000/api/ai/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log("响应状态:", response.status, response.statusText);
        
        const responseText = await response.text();
        console.log("\n响应内容:");
        console.log(responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log("\n解析结果:");
            console.log("- Success:", data.success);
            console.log("- Text Support:", data.textSupport);
            console.log("- Vision Support:", data.visionSupport);
            console.log("- Text Error:", data.textError);
            console.log("- Vision Error:", data.visionError);
            console.log("- Model Info:", data.modelInfo);
        }
    } catch (error) {
        console.error("测试失败:", error.message);
    }
}

require('dotenv').config();
testProjectAPI();