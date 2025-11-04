const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`收到请求: ${req.method} ${req.url}`);
  
  // 只允许POST请求
  if (req.method !== 'POST') {
    console.warn(`不支持的请求方法: ${req.method}`);
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    console.log('解析请求体...');
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const requestData = JSON.parse(bodyData);
        const { message, scene } = requestData;

        console.log('请求参数:', { message, scene });

        if (!message) {
          console.warn('消息内容为空');
          return res.status(400).json({ error: '消息内容不能为空' });
        }

        // 从环境变量获取API密钥
        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        console.log('环境变量检查 - API密钥前3位:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.substring(0, 3) + '...' : '未设置');

        if (!DEEPSEEK_API_KEY) {
          console.error('DeepSeek API密钥未设置');
          return res.status(500).json({ 
            success: false,
            error: '服务配置错误：API密钥未设置',
            debug: '请检查Vercel环境变量DEEPSEEK_API_KEY'
          });
        }

        // 根据场景构建系统提示
        const scenePrompts = {
          homework: "你是一位专业的亲子教育专家，专注于作业辅导场景。请提供具体可操作的沟通话术，帮助家长解决孩子学习中的问题。回复要生动具体，有实际对话示例。",
          emotion: "你是一位专业的亲子教育专家，专注于情绪管理场景。请帮助家长理解孩子的情绪，建立情感连接。给出具体的情感回应话术。",
          discipline: "你是一位专业的亲子教育专家，专注于行为规范场景。请帮助家长设定合理界限，培养良好习惯。提供明确的沟通框架。",
          screen: "你是一位专业的亲子教育专家，专注于屏幕时间管理场景。请帮助家长平衡孩子的数字生活。给出实用的时间管理建议。",
          friend: "你是一位专业的亲子教育专家，专注于朋友关系场景。请帮助家长处理孩子的同伴关系问题。提供社交技巧指导。",
          school: "你是一位专业的亲子教育专家，专注于学校生活场景。请帮助家长应对孩子的学业压力和学校事务。给出具体的支持策略。"
        };

        const systemPrompt = scenePrompts[scene] || "你是一位专业的亲子教育专家，拥有20年儿童教育经验。请为家长提供专业、实用的亲子沟通建议，要求回复具体、可操作、有实例。";

        console.log('准备调用DeepSeek API，场景:', scene);
        
        // 注意：这里将变量名改为deepseekRequest避免冲突
        const deepseekRequest = {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: systemPrompt + " 请用中文回复，提供具体可操作的建议，避免通用模板式回答。"
            },
            {
              role: "user",
              content: `家长问题：${message}\n\n请针对这个问题给出具体的亲子沟通话术建议：`
            }
          ],
          max_tokens: 2000,
          temperature: 0.8,  // 提高创造性
          stream: false
        };

        console.log('请求体:', JSON.stringify(deepseekRequest).substring(0, 200) + '...');

        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify(deepseekRequest),
          timeout: 30000
        });

        console.log('DeepSeek API响应状态:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('DeepSeek API错误详情:', response.status, errorText);
          return res.status(500).json({ 
            success: false,
            error: `API请求失败: ${response.status}`,
            details: errorText
          });
        }

        const responseData = await response.json();
        console.log('DeepSeek API返回数据:', JSON.stringify(responseData).substring(0, 300) + '...');
        
        if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
          const reply = responseData.choices[0].message.content;
          console.log('成功生成回复，长度:', reply.length);
          return res.status(200).json({
            success: true,
            reply: reply
          });
        } else {
          console.error('DeepSeek API返回格式异常:', JSON.stringify(responseData));
          throw new Error('DeepSeek API返回格式异常');
        }
      } catch (parseError) {
        console.error('解析请求体出错:', parseError);
        return res.status(400).json({
          success: false,
          error: '请求格式错误'
        });
      }
    });
  } catch (error) {
    console.error('处理请求出错:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '服务器内部错误',
      type: error.name
    });
  }
};
