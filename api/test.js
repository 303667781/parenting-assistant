// api/test.js - 简单测试文件
export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: "API 路由工作正常！",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
