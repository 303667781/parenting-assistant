module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    console.log('健康检查请求');
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '亲子沟通话术助手'
    });
  }

  return res.status(405).json({ error: '只允许GET请求' });
};
