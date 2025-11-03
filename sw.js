const CACHE_NAME = 'parenting-assistant-v1.0.0';

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  event.waitUntil(self.clients.claim());
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 只缓存当前域名的请求
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 网络失败时返回离线页面
          return new Response('网络连接失败，请检查网络后重试', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
  }
});
