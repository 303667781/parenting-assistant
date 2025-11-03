// api/test.js - 超简单版本
export default function handler(request, response) {
  console.log('TEST API被调用了');
  
  // 直接返回简单响应，不涉及任何复杂逻辑
  return response.status(200).json({
    success: true,
    message: "✅ API 测试成功！",
    timestamp: new Date().toISOString(),
    simple: "这是一个最简单的测试"
  });
}
