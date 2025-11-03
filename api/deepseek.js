// api/deepseek.js
export default async function handler(req, res) {
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
    
    if (!apiKey) {
      console.error('DeepSeek API key not configured');
      return res.status(500).json({ 
        error: 'Service configuration error',
        reply: getFallbackResponse(message, scene)
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
            content: `你是一位专业的亲子沟通专家，拥有20年儿童教育经验。请针对用户关于${getSceneName(scene)}的问题，提供专业、实用、可操作的沟通话术建议。要求：用温暖、支持性的语言，提供具体话术示例，分析孩子行为背后的原因，给出分步骤的沟通策略。用中文回复。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
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
    console.error('API Error:', error);
    
    // 出错时返回降级回复
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
  const responses = {
    homework: `关于作业辅导，我建议：\n\n1. 创造安静的学习环境\n2. 制定固定的作业时间表\n3. 使用积极鼓励的语言\n4. 分解复杂任务为小步骤\n\n针对您的问题"${message}"，可以尝试先了解孩子遇到的具体困难，然后一起制定解决方案。`,
    emotion: `关于情绪管理，我建议：\n\n1. 先认可孩子的情绪\n2. 帮助孩子给情绪命名\n3. 教孩子合适的表达方式\n4. 一起寻找解决办法\n\n针对"${message}"，请记住情绪没有对错，重要的是如何表达和处理。`,
    discipline: `关于行为规范，我建议：\n\n1. 设定清晰一致的规则\n2. 解释规则背后的原因\n3. 使用积极的语言引导\n4. 给予有限的选择权\n\n针对"${message}"，保持冷静和一致性很重要。`,
    screen: `关于屏幕时间管理，我建议：\n\n1. 共同制定使用规则\n2. 提供有趣的替代活动\n3. 以身作则控制使用时间\n4. 关注内容质量而非时长\n\n针对"${message}"，平衡是关键。`,
    friend: `关于朋友关系，我建议：\n\n1. 倾听孩子的社交困扰\n2. 教孩子基本的社交技巧\n3. 帮助孩子设立健康边界\n4. 鼓励发展多元友谊\n\n针对"${message}"，社交技能需要慢慢培养。`,
    school: `关于学校生活，我建议：\n\n1. 每天与孩子聊聊学校生活\n2. 关注孩子的社交情感发展\n3. 与老师保持良好沟通\n4. 帮助孩子应对学业压力\n\n针对"${message}"，理解和支持最重要。`
  };
  
  return responses[scene] || `关于亲子沟通，我理解您遇到了"${message}"这样的问题。良好的沟通需要耐心和理解，建议先倾听孩子的想法，再用温和但坚定的方式表达您的期望。`;
}
