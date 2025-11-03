// 使用 CommonJS 语法
module.exports = async (req, res) => {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, scene } = req.body;
    
    console.log('收到请求:', { message, scene });
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        reply: `🔧 服务配置中。测试回复：关于${getSceneName(scene)}，我理解"${message}"`
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
            content: `你是亲子沟通专家，针对${getSceneName(scene)}提供具体话术。用中文回复。`
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
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      res.status(200).json({
        success: true,
        reply: data.choices[0].message.content
      });
    } else {
      throw new Error('API返回格式错误');
    }
    
  } catch (error) {
    console.error('API错误:', error);
    res.status(200).json({
      success: true,
      reply: `服务暂时遇到问题：${error.message}`
    });
  }
};

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
