const CACHE_NAME = 'parenting-assistant-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 对于 API 请求，使用网络优先策略
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应以进行缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取
          return caches.match(event.request);
        })
    );
  } else {
    // 对于其他资源，使用缓存优先策略
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 返回缓存或网络请求
          return response || fetch(event.request);
        })
    );
  }
});