const staticCacheName = 'mws-restaurant-static-v1';

if (('function' === typeof importScripts) && (typeof idb === 'undefined')) {
    self.importScripts('js/idb.js');
}

const dbPromise = idb.open('mws-restaurant-db', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants');
  }
});

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
          '/js/idb.js',
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
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (requestUrl.port == 1337) {
    console.log('json request:',request);
    //event.respondWith(fetch(request))
    event.respondWith(idbResponse(request));
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
          statusText: "Not connected to the internet"
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

function idbResponse(request) {
  return idbKeyVal.get('restaurants')
    .then(restaurants => {
      return (
        restaurants ||
        fetch(request)
          .then(response => response.json())
          .then(json => {
            idbKeyVal.set('restaurants', json);
            return json;
          })
      );
    })
    .then(response => new Response(JSON.stringify(response)))
    .catch(error => {
      return new Response(error, {
        status: 404,
        statusText: 'Invalid Request'
      });
    });
}

// IndexedDB object with get & set methods
// See https://github.com/jakearchibald/idb for more info
const idbKeyVal = {
  get(key) {
    return dbPromise.then(db => {
      return db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(key);
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(val, key);
      return tx.complete;
    });
  }
};
