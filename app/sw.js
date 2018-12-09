const staticCacheName = 'mws-restaurant-static-v164';

if (('function' === typeof importScripts) && (typeof idb === 'undefined')) {
    self.importScripts('/js/idb.js');
    self.importScripts('/js/dbhelper.js');
    self.importScripts('/js/idbhelper.js');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        return cache.addAll([
          '/index.html',
          '/css/styles.css',
          'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
          'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
          '/browser-sync/browser-sync-client.js?v=2.26.3',
          '/js/dbhelper.js',
          '/js/register_service_worker.js',
          '/js/main.js',
          '/js/idb.js',
          '/js/idbhelper.js',
          '/js/restaurant_info.js',
          '/img/offline.jpg',
          '/img/icon/Icon.png',
          '/favicon.ico',
          '/manifest.json',
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
          /*'/data/restaurants.json',*/
          '/restaurant.html',
          '/restaurant.html?id=1',
          '/restaurant.html?id=2',
          '/restaurant.html?id=3',
          '/restaurant.html?id=4',
          '/restaurant.html?id=5',
          '/restaurant.html?id=6',
          '/restaurant.html?id=7',
          '/restaurant.html?id=8',
          '/restaurant.html?id=9',
          '/restaurant.html?id=10'
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
                    return cacheName.startsWith('mws-restaurant-static-') &&
                           cacheName != staticCacheName;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (requestUrl.port == 1337) {
    if (event.request.method !== 'GET') {
      return;
    }
    //event.respondWith(idbResponse(request));
    if (request.url.includes('reviews')) {
      let id = +requestUrl.searchParams.get('restaurant_id');
      event.respondWith(idbReviewResponse(request, id));
    } else {
      event.respondWith(idbRestaurantResponse(request));
    }
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(staticCacheName).then(cache => {
            // Let the browser do its default thing
            // for non-GET requests.
            if (event.request.method != 'GET') return;
            if (!(event.request.url.indexOf('http') === 0)) {
              //  Do not try to cache a request that is not http/https
            } else {
              // filter out browser-sync resources otherwise it will err
              if (!fetchResponse.url.includes('browser-sync')) { // prevent err
                cache.put(event.request, fetchResponse.clone());
              }
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
          statusText: 'Not connected to the internet'
        });
      })
    );
  }
});

/*
self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (requestUrl.port === '1337') {
    event.respondWith(idbResponse(request));
  }
  else {
    event.respondWith(cacheResponse(request));
  }
});
*/
/*
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(staticCacheName).then(cache => {
          // filter out browser-sync
          if (!fetchResponse.url.includes('browser-sync')) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(error => new Response(error));
  );
});
*/
function cacheResponse(request) {
  return caches.match(request)
    .then(response => {
      return
        response ||
        fetch(request).then(fetchResponse => {
          return caches.open(staticCacheName).then(cache => {
            // filter out browser-sync
            if (!fetchResponse.url.includes('browser-sync')) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
      });
  }).catch(error => console.error(error));
}

function idbRestaurantResponse(request) {
  return idbKeyVal.getAll('restaurants')
    .then(restaurants => {
      if (restaurants.length) {
        return restaurants;
      }
      return fetch(request)
          .then(response => response.json())
          .then(json => {
          json.forEach(restaurant => {
            idbKeyVal.set('restaurants', restaurant);
          });
          return json;
        });
    })
    .then(response => new Response(JSON.stringify(response)))
    .catch(error => {
      return new Response(error, {
        status: 404,
        statusText: 'Invalid Request'
      });
    });
}

function idbReviewResponse(request, id) {
  return idbKeyVal.getAllIdx('reviews', 'restaurant_id', id)
    .then(reviews => {
      if (reviews.length) {
        return reviews;
      }
      return fetch(request)
        .then(response => response.json())
        .then(json => {
          json.forEach(review => {
            idbKeyVal.set('reviews', review);
          });
          return json;
        });
    })
    .then(response => new Response(JSON.stringify(response)))
    .catch(error => {
      return new Response(error, {
        status: 404,
        statusText: 'Invalid Request'
      });
    });
}
