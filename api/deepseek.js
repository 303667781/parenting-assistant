// api/deepseek.js - 超简单版本
export default function handler(request, response) {
  console.log('DEEPSEEK API被调用了', request.method);
  
  // 处理 OPTIONS 请求（CORS）
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      error: 'Method not allowed. Use POST.' 
    });
  }
  
  try {
    // 解析请求体
    const { message, scene } = request.body;
    
    console.log('收到请求:', { message, scene });
    
    // 直接返回一个简单的成功响应
    return response.status(200).json({
      success: true,
      reply: `✅ 收到您的消息："${message}"。场景：${scene}。AI服务准备就绪。`,
      debug: {
        messageLength: message?.length || 0,
        scene: scene || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('处理请求时出错:', error);
    
    return response.status(200).json({
      success: true,
      reply: "抱歉，服务暂时遇到问题，请稍后重试。"
    });
  }
}
