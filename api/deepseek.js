// api/deepseek.js - 简化版本
export default async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, scene } = req.body;
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        reply: `🔧 服务配置中。测试回复：关于${getSceneName(scene)}，我理解您遇到了"${message}"。建议先倾听理解孩子。`
      });
    }
    
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            content: `你是专业的亲子沟通专家，拥有20年教育经验。针对${getSceneName(scene)}场景，提供具体可操作的沟通话术建议。用温暖支持的语言，用中文回复。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      res.status(200).json({
        success: true,
        reply: data.choices[0].message.content
      });
    } else {
      throw new Error('API 返回格式错误');
    }
    
  } catch (error) {
    console.error('API 错误:', error);
    res.status(200).json({
      success: true,
      reply: `抱歉，AI服务暂时遇到问题。错误: ${error.message}`
    });
  }
}

function getSceneName(scene) {
  const scenes = {
    homework: '作业辅导',
    emotion: '情绪管理',
    discipline: '行为规范',
    screen: '屏幕时间', 
    friend: '朋友关系',
    school: '学校生活'
  };
  return scenes[scene] || '亲子沟通';
}
