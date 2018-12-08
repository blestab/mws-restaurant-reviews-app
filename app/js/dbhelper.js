/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  static markFavorite(id) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true`, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }

  static unMarkFavorite(id) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false`, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }

  static fetchRestaurantReviewsById(id, callback) {
    fetch(DBHelper.DATABASE_URL + `/reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(err => callback(err, null));
  }

  static createRestaurantReview(restaurant_id, name, rating, comments, callback) {
    const url = DBHelper.DATABASE_URL + '/reviews/';
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const method = 'POST';
    const data = {
      restaurant_id: restaurant_id,
      name: name,
      rating: +rating,
      comments: comments
    };
    const body = JSON.stringify(data);

    fetch(url, {
      headers: headers,
      method: method,
      body: body
    })
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(err => {
      /* We are offline so lets save review to IndexedDB */
      DBHelper.createIDBReview(data)
        .then(review_key => {
          DBHelper.addRequestToQueue(url, headers, method, data, review_key)
            .then(offline_key => console.log('added request:', offline_key));
        });
      callback(err, null);
    });
  }

  static toggleFavorite(restaurant, callback) {
    const is_favorite = JSON.parse(restaurant.is_favorite);
    const id = +restaurant.id;
    restaurant.is_favorite = !is_favorite;

    const url = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${!is_favorite}`;
    const method = 'PUT';

    fetch(url, {
      method: method
    })
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(err => {
        /* We are offline so lets save review to IndexedDB */
        DBHelper.updateIDBRestaurant(restaurant)
          .then(() => {
            // add to sync queue...
            DBHelper.addRequestToQueue(url, {}, method, '')
              .then(offline_key => console.log('added request:', offline_key));
          });
        callback(err, null);
      });
  }

  static updateIDBRestaurant(restaurant) {
    return idbKeyVal.set('restaurants', restaurant);
  }

  static createIDBReview(review) {
    return idbKeyVal.setReturnId('reviews', review)
      .then(id => {
        return id;
      });
  }

  static addRequestToQueue(url, headers, method, data, review_key) {
    const request = {
      url: url,
      headers: headers,
      method: method,
      data: data,
      review_key: review_key
    };
    return idbKeyVal.setReturnId('offline', request)
      .then(id => {
        return id;
      });
  }

  static processQueue() {
  // Open offline queue & return cursor
    dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction(['offline'], 'readwrite');
      const store = tx.objectStore('offline');
      return store.openCursor();
    })
      .then(function nextRequest (cursor) {
        if (!cursor) {
          return;
        }

        const offline_key = cursor.key;
        const url = cursor.value.url;
        const headers = cursor.value.headers;
        const method = cursor.value.method;
        const data = cursor.value.data;
        const review_key = cursor.value.review_key;
        const body = JSON.stringify(data);

        fetch(url, {
          headers: headers,
          method: method,
          body: body
        })
          .then(response => response.json())
          .then(data => {
            /* 1. Clear request record from offline store */
            dbPromise.then(db => {
              const tx = db.transaction(['offline'], 'readwrite');
              tx.objectStore('offline').delete(offline_key);
              return tx.complete;
            })
              .then(() => {
                /* Is this a review or favorite update ? */
                if (review_key === undefined) {
                  console.log('Favorite posted to server.');
                } else {
                  /* 2. Add new review to the reviews store
                     3. Delete old review record from the reviews store */
                  dbPromise.then(db => {
                    const tx = db.transaction(['reviews'], 'readwrite');
                    return tx.objectStore('reviews').put(data)
                      .then(() => tx.objectStore('reviews').delete(review_key))
                      .then(() => {
                        return tx.complete;
                      })
                      .catch(err => {
                        tx.abort();
                      });
                  })
                    .then(() => console.log('Review transaction successful!'))
                    .catch(err => console.log('Offline store error', err));
                }
              })
              .then(() => console.log('Offline record deleted successfully!'))
              .catch(err => console.log('Offline store error', err));

          }).catch(err => {
            console.log('Fetch error. We are possibly offline.');
            console.log(err);
            return;
          });
        return cursor.continue().then(nextRequest);
      })
      .then(() => console.log('Done'))
      .catch(err => console.log('Error opening cursor', err));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    let xhr = new XMLHttpRequest();
    /*xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json.restaurants;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
    */
    /*fetch(DBHelper.DATABASE_URL)
      .then(response => {
        if (!response.ok) {
          throw Error(`Request failed. Returned status of ${response.statusText}`);
        }
        const restaurants = response.json();
        return restaurants;
      })
      .then(restaurants => callback(null, restaurants))
      .catch(err => callback(err, null));*/
    fetch(DBHelper.DATABASE_URL + '/restaurants/')
    .then(response => response.json())
    .then(restaurants => callback(null, restaurants))
    .catch(err => callback(err, null))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph && restaurant.photograph.endsWith('.jpg')) {
        return (`/img/${restaurant.photograph}`);
    } else {
      return (`/img/${restaurant.id}-small.jpg`);
    }
  }

  /**
   * Restaurant image alt text.
   */
  static imageAlttextForRestaurant(restaurant) {
    if (restaurant.alt_text) {
      return (`${restaurant.alt_text}`);
    } else {
      return (`${restaurant.name}`);
    }
  }

  /**
   * Home Page image Srcset.
   */
  static imageSrcsetForHomePage(restaurant) {
    if (restaurant.srcset_home) {
      return (`${restaurant.srcset_home}`);
    } else {
      return (`img/${restaurant.id}-small.jpg 1x,
               img/${restaurant.id}-medium.jpg 2x`)
    }
  }

  /**
   * Restaurant Page image Srcset.
   */
  static imageSrcsetForRestaurantPage(restaurant) {
    if (restaurant.srcset_restaurant) {
      return (`${restaurant.srcset_restaurant}`);
    } else {
      return (`img/${restaurant.id}-small.jpg 400w,
               img/${restaurant.id}-medium.jpg 600w,
               img/${restaurant.id}-large.jpg 800w`)
    }
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

if(typeof window !== 'undefined')
  window.DBHelper = DBHelper;   // <- exposes DBHelper on window (global) object
