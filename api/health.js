// 最简单的健康检查端点
module.exports = (req, res) => {
  console.log('健康检查被调用');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '服务器正常运行'
  });
};
