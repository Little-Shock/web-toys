// 元素波纹 Service Worker - 优化版本
const CACHE_NAME = 'element-ripples-v2';

// 核心资源 - 必须缓存
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/audio-manager.js',
  './js/ripple-renderer.js',
  './js/main.js',
  './manifest.json'
];

// 次要资源 - 如果可能，也缓存这些
const SECONDARY_ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap'
];

// 所有要缓存的资源
const ASSETS = [...CORE_ASSETS, ...SECONDARY_ASSETS];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 - 优化版本
self.addEventListener('fetch', event => {
  // 获取请求URL
  const requestURL = new URL(event.request.url);

  // 针对不同类型的请求使用不同的策略

  // 1. 核心应用资源 - 缓存优先，网络回退
  if (CORE_ASSETS.includes(requestURL.pathname) ||
      requestURL.pathname === '/' ||
      requestURL.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // 返回缓存的响应，同时在后台更新缓存
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // 更新缓存
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseToCache));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse); // 如果网络请求失败，仍使用缓存

          return cachedResponse || fetchPromise;
        })
        .catch(() => {
          // 如果是导航请求且缓存失败，返回首页
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return fetch(event.request);
        })
    );
    return;
  }

  // 2. 图片和字体资源 - 缓存优先，网络回退，但缓存所有成功响应
  if (requestURL.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then(networkResponse => {
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }

              // 缓存新获取的资源
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));

              return networkResponse;
            });
        })
    );
    return;
  }

  // 3. API请求和其他资源 - 网络优先，缓存回退
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果是同源请求且响应有效，缓存它
        if (requestURL.origin === location.origin && response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // 网络请求失败时尝试从缓存获取
        return caches.match(event.request);
      })
  );
});
