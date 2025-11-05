// 最简单的健康检查
module.exports = (req, res) => {
  console.log('健康检查被调用');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'API基础功能正常'
  });
};
