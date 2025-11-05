const CACHE_NAME = 'parenting-assistant-v1.0.1'; // 更新版本号
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/css/styles.css', // 如果有CSS文件
  '/js/app.js' // 如果有JS文件
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('所有核心文件已缓存');
        return self.skipWaiting(); // 立即激活
      })
      .catch(error => {
        console.error('缓存失败:', error);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 已激活');
      return self.clients.claim(); // 立即控制所有页面
    })
  );
});

// 拦截请求 - 优化版本
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 跳过API请求和非GET请求
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // 跳过第三方资源
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，直接返回
        if (response) {
          console.log('从缓存返回:', event.request.url);
          return response;
        }

        // 否则从网络请求，并缓存新资源
        return fetch(event.request)
          .then(networkResponse => {
            // 只缓存成功的响应
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('新资源已缓存:', event.request.url);
                });
            }
            return networkResponse;
          })
          .catch(error => {
            console.error('网络请求失败:', error);
            // 可以在这里返回一个离线页面
            return new Response('网络连接失败，请检查网络连接', {
              status: 408,
              statusText: 'Network Timeout'
            });
          });
      })
  );
});

// 添加消息处理（可选）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
