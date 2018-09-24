
/**
 * Common database helper functions.
 */

class DBHelper {
	//create and open a Database
	static openDB() {
		//make cases for updates
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		}
		return idb.open('restIDB', 3, (upgradeDb) => {
			switch(upgradeDb.oldVersion) {
			case 0:
				upgradeDb.createObjectStore('restaurants', {keyPath: 'id'}); //autoincrement will add duplicates to DB on put
			case 1:
				const reviewsIDB = upgradeDb.createObjectStore('reviews', {autoIncrement: true, keyPath: 'id'});
				reviewsIDB.createIndex('ID', 'restaurant_id');
			}
		});
	}
	/**
	 * Database URL.
	 *
	 */

	static get DATABASE_URL() {
		// Change this to your server port
		const port = 1337;
		return `http://localhost:${port}/restaurants`;
	}
	static get REVIEW_URL() {
		// Change this to your server port
		const port = 1337;
		//to store only each restaurant id when visited, instead of trying to store full db on first load
		let windowPath = window.location.href;
		let rID = windowPath.split('?id=').pop();
		return `http://localhost:${port}/reviews/?restaurant_id=${rID}`;
	}
	/**
	 * Fetch all restaurants.
	 */

	static fetchRestaurants(callback) {
		let dbPromise = DBHelper.openDB();
		//fetch restaurants from IDB even when offline. Opens DB and gets all restaurants
		dbPromise.then(db => {
			var tx = db.transaction('restaurants', 'readonly');
			var store = tx.objectStore('restaurants');
			return store.getAll();
		})
			.then(response => {
				return response;
			}).then(data => callback(null, data))
			.catch(error => callback(`fetch request of restaurants failed ${error.statusText}`, null));
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
				let results = restaurants;
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
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
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
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}
	//called by fillrestaurantsHTML
	static fetchReviews() {
		let dbPromise = DBHelper.openDB();
		dbPromise.then(db => {
			//opens DB and gets reviews for restaurants visited.
			var tx = db.transaction('reviews', 'readonly');
			var store = tx.objectStore('reviews');
			return store.getAll();
		})
			.then(response => {
				//calls restaurant_info.js fillreviews so transaction stays open. Returning response ends async request.
				fillReviewsHTML(response);
			});
	}

	//store favorite value in idb, takes values from fillrestaurantshtml onclick
	static setFavorite(truthy, id) {
		let faveURL = `http://localhost:1337/restaurants/${id}/?is_favorite=${truthy}`;
		console.log(faveURL);
		fetch(faveURL, {method: 'PUT'}).then(response => {
			console.log(response);
			//open favorites and change to true/false based
		});
	}
	static localStorageFavorite(truthy, id) {
		return localStorage.setItem(id, truthy);
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
	//handle missing photo
	static imageUrlForRestaurant(restaurant) {

		if (restaurant.photograph) {
			return (`/img/${restaurant.photograph}`);
		} else {
			return (`/img/${restaurant.id}.jpg`); //fixes incomplete data in rest server for Restaurant 10
		}
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
			{title: restaurant.name,
				alt: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant)
			});
		marker.addTo(newMap);
		return marker;
	}

}
