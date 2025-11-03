// 最简单的测试
export default function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  return response.status(200).json({
    success: true,
    message: '🎉 API测试成功！',
    timestamp: new Date().toISOString()
  });
}
