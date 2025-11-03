// 最简单的可工作版本
export default async function handler(request, response) {
  // 记录请求
  console.log('API被调用:', request.method);
  
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // 只处理POST请求
  if (request.method !== 'POST') {
    return response.status(405).json({ error: '只支持POST请求' });
  }
  
  try {
    const { message, scene } = request.body;
    
    console.log('收到消息:', { message, scene });
    
    // 检查环境变量
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return response.status(200).json({
        success: true,
        reply: '🔧 服务配置中，请稍后重试。当前问题：' + message
      });
    }
    
    // 调用DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的亲子沟通专家，提供具体可操作的沟通话术建议。用中文回复。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    if (!deepseekResponse.ok) {
      throw new Error(`DeepSeek API错误: ${deepseekResponse.status}`);
    }
    
    const data = await deepseekResponse.json();
    
    if (data.choices && data.choices[0]) {
      return response.status(200).json({
        success: true,
        reply: data.choices[0].message.content
      });
    } else {
      throw new Error('API返回格式错误');
    }
    
  } catch (error) {
    console.error('错误详情:', error);
    return response.status(200).json({
      success: true,
      reply: `抱歉，服务暂时遇到问题。错误: ${error.message}`
    });
  }
}
