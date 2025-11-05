export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({ 
    status: 'ok', 
    message: '亲子沟通助手服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
