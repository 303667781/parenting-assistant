const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 使用Vercel推荐的函数签名
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('API被调用，方法:', req.method, '路径:', req.url);

  // 只允许POST请求
  if (req.method !== 'POST') {
    console.log('拒绝非POST请求');
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    // 解析请求体 - 使用Vercel推荐的body解析方式
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message, scene } = JSON.parse(body);
        console.log('解析的请求参数:', { message, scene });

        if (!message) {
          return res.status(400).json({ error: '消息内容不能为空' });
        }

        // 从环境变量获取API密钥
        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        console.log('API密钥状态:', DEEPSEEK_API_KEY ? '已设置' : '未设置');

        if (!DEEPSEEK_API_KEY) {
          return res.status(500).json({ 
            error: 'API密钥未配置'
          });
        }

        // 简化提示词，确保稳定性
        const systemPrompt = "你是一位亲子教育专家，请提供具体实用的沟通建议。";
        
        console.log('调用DeepSeek API...');
        
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
                content: systemPrompt
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        console.log('DeepSeek API响应状态:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API错误:', errorText);
          return res.status(500).json({ error: 'AI服务暂时不可用' });
        }

        const data = await response.json();
        console.log('收到AI回复');
        
        if (data.choices && data.choices[0]?.message?.content) {
          const reply = data.choices[0].message.content;
          return res.status(200).json({
            success: true,
            reply: reply
          });
        } else {
          throw new Error('回复格式异常');
        }
      } catch (error) {
        console.error('处理请求错误:', error);
        return res.status(400).json({ error: '请求格式错误' });
      }
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
};
