export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, scene, userType, requireFullReply } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 这里替换成您的DeepSeek API密钥
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

    if (!DEEPSEEK_API_KEY) {
      console.error('DeepSeek API key is missing');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // 根据场景构建系统提示
    const scenePrompts = {
      homework: "你是一位专业的亲子教育专家，专注于作业辅导场景。请提供具体可操作的沟通话术，帮助家长解决孩子学习中的问题。",
      emotion: "你是一位专业的亲子教育专家，专注于情绪管理场景。请帮助家长理解孩子的情绪，建立情感连接。",
      discipline: "你是一位专业的亲子教育专家，专注于行为规范场景。请帮助家长设定合理界限，培养良好习惯。",
      screen: "你是一位专业的亲子教育专家，专注于屏幕时间管理场景。请帮助家长平衡孩子的数字生活。",
      friend: "你是一位专业的亲子教育专家，专注于朋友关系场景。请帮助家长处理孩子的同伴关系问题。",
      school: "你是一位专业的亲子教育专家，专注于学校生活场景。请帮助家长应对孩子的学业压力和学校事务。"
    };

    const systemPrompt = scenePrompts[scene] || "你是一位专业的亲子教育专家，拥有20年儿童教育经验。请为家长提供专业、实用的亲子沟通建议。";

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt + " 请用中文回复，提供具体可操作的建议。"
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      return res.status(200).json({
        success: true,
        reply: reply
      });
    } else {
      throw new Error('Invalid response format from DeepSeek API');
    }

  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
