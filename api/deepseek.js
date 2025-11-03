// api/deepseek.js - 修复版本
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, scene } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 从环境变量获取 DeepSeek API 密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    console.log('API Key exists:', !!apiKey);
    console.log('Request scene:', scene);
    
    if (!apiKey) {
      console.error('DeepSeek API key not configured');
      return res.status(200).json({ 
        success: true,
        reply: `⚠️ 服务配置中，请稍后重试。模拟回复：关于${getSceneName(scene)}，我理解您遇到了"${message}"这样的问题。建议先倾听孩子的想法，再温和表达您的期望。`
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
            content: `你是一位专业的亲子沟通专家，拥有20年儿童教育经验。请针对用户关于${getSceneName(scene)}的问题，提供专业、实用、可操作的沟通话术建议。`
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      return res.status(200).json({ 
        success: true, 
        reply: reply
      });
    } else {
      throw new Error('API 返回格式错误');
    }

  } catch (error) {
    console.error('API Error:', error);
    
    // 出错时返回友好的降级回复
    return res.status(200).json({
      success: true,
      reply: getFallbackResponse(req.body?.message, req.body?.scene)
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

function getFallbackResponse(message, scene) {
  return `关于${getSceneName(scene)}，我理解您遇到了"${message}"这样的问题。目前AI服务暂时不可用，建议您：\n\n1. 先冷静倾听孩子的想法\n2. 用温和的语气表达您的关心\n3. 一起寻找双方都能接受的解决方案\n\n服务恢复后我会为您提供更详细的建议。`;
}
