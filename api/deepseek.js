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

        // 根据场景构建更具体的系统提示
        const scenePrompts = {
          homework: `你是一位有20年经验的亲子教育专家，专门解决作业辅导问题。请针对家长的具体困境提供：

1. 【具体对话示例】给出3-4句真实的亲子对话，要生动自然
2. 【分步骤行动指南】提供可操作的3个步骤
3. 【教育原理】简单解释为什么这个方法有效
4. 【注意事项】提醒家长避免的常见误区

请用亲切、支持性的语气，避免说教。针对这个具体问题：`,

          emotion: `你是一位儿童心理专家，擅长情绪管理。请为家长提供：

1. 【共情话术】先理解孩子情绪的2-3句话
2. 【情绪命名】帮助孩子识别自己情绪的方法
3. 【解决策略】具体的情绪调节技巧
4. 【后续跟进】如何预防类似情绪爆发

用温暖、理解的语言，站在孩子角度思考。问题：`,

          discipline: `你是行为规范专家，请提供：

1. 【规则设定】如何清晰表达界限
2. 【正面引导】用积极语言替代禁止性语言
3. 【后果自然】合理的自然后果是什么
4. 【长期培养】如何逐步建立习惯

要具体、可执行，避免空洞说教。当前问题：`,

          screen: `你是数字教育专家，请帮助家长：

1. 【理解需求】孩子为什么沉迷屏幕
2. 【替代活动】提供有吸引力的线下活动建议
3. 【时间管理】具体的屏幕时间安排表
4. 【家庭规则】如何全家一起遵守

给出具体的时间数字和活动例子。问题：`,

          friend: `你是儿童社交发展专家，请指导：

1. 【情境分析】孩子社交困难的深层原因
2. 【沟通技巧】教孩子如何表达自己
3. 【社交练习】可以在家做的角色扮演游戏
4. 【家长支持】如何与老师合作

用案例说明，不要理论堆砌。问题：`,

          school: `你是学校教育顾问，请帮助：

1. 【问题定位】具体是学业压力还是人际关系
2. 【资源对接】可以向学校申请什么支持
3. 【家庭配合】家长在家能做什么
4. 【进度追踪】如何评估改善效果

要实用、接地气。问题：`
        };

        const systemPrompt = scenePrompts[scene] || `你是有20年经验的亲子教育专家。请针对具体问题给出：
1. 真实可用的对话示例
2. 分步骤的行动指南  
3. 简单明白的原理解释
4. 实际操作的注意事项

用亲切支持的语气，避免空洞理论。问题：`;

        console.log('优化后的系统提示:', systemPrompt.substring(0, 100) + '...');

        // 构建更具体的用户消息
        const userMessage = `【家长求助详情】
${message}

【请针对以上问题提供】：
1. 真实可用的亲子对话示例（3-4句）
2. 分步骤的具体操作指南
3. 简单的教育原理说明
4. 实际注意事项提醒

请用亲切自然的语言回复，避免理论堆砌。`;

        console.log('准备调用DeepSeek API，场景:', scene);
        
        const deepseekRequest = {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: systemPrompt + message
            },
            {
              role: "user", 
              content: userMessage
            }
          ],
          max_tokens: 2500,  // 增加token限制以获得更详细回复
          temperature: 0.8,
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
