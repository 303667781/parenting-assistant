// api/health.js - 健康检查文件
module.exports = async (req, res) => {
  console.log('健康检查被调用');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'API服务正常'
    });
  }
  
  return res.status(405).json({ error: '只允许GET请求' });
};
