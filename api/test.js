// api/test.js - 最简单的测试 API
export default function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: "🎉 API 测试成功！",
    timestamp: new Date().toISOString()
  });
}
