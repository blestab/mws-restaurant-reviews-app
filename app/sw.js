const staticCacheName = 'mws-restaurant-static-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        return cache.addAll([
          '/index.html',
          '/css/styles.css',
          '/js/dbhelper.js',
          '/js/register_sw.js',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/img/offline.jpg',
          '/img/icon/Icon.png',
          '/favicon.ico',
          '/img/1-small.jpg',
          '/img/1-medium.jpg',
          '/img/1-large.jpg',
          '/img/2-small.jpg',
          '/img/2-medium.jpg',
          '/img/2-large.jpg',
          '/img/3-small.jpg',
          '/img/3-medium.jpg',
          '/img/3-large.jpg',
          '/img/4-small.jpg',
          '/img/4-medium.jpg',
          '/img/4-large.jpg',
          '/img/5-small.jpg',
          '/img/5-medium.jpg',
          '/img/5-large.jpg',
          '/img/6-small.jpg',
          '/img/6-medium.jpg',
          '/img/6-large.jpg',
          '/img/7-small.jpg',
          '/img/7-medium.jpg',
          '/img/7-large.jpg',
          '/img/8-small.jpg',
          '/img/8-medium.jpg',
          '/img/8-large.jpg',
          '/img/9-small.jpg',
          '/img/9-medium.jpg',
          '/img/9-large.jpg',
          '/img/10-small.jpg',
          '/img/10-medium.jpg',
          '/img/10-large.jpg',
          '/data/restaurants.json',
          '/restaurant.html'
          /*'/restaurant.html?id=1',
          '/restaurant.html?id=2',
          '/restaurant.html?id=3',
          '/restaurant.html?id=4',
          '/restaurant.html?id=5',
          '/restaurant.html?id=6',
          '/restaurant.html?id=7',
          '/restaurant.html?id=8',
          '/restaurant.html?id=9',
          '/restaurant.html?id=10'*/
        ]).catch(error => {
          console.log('Caches open failed: ' + error);
        });
      })
  );
});

self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('currency-') &&
                           cacheName != staticCacheName;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(staticCacheName).then(cache => {
          if(!(event.request.url.indexOf('http') === 0)){
             /*
              Do not try to cache a request that is not http/https
             */
          } else {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(error => {
      if (event.request.url.includes('.jpg')) {
        return caches.match('/img/offline.jpg');
      }
      return new Response('Not connected to the internet', {
        status: 404,
        statusText: "Not connected to the internet"
      });
    })
  );
});
