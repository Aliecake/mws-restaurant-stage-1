//storage of restaurants
function storeRestaurants() {
	let dbPromise = DBHelper.openDB();
	//retrieve json
	fetch(`${DBHelper.DATABASE_URL}`, {method: 'GET'})
		.then(response => {
			//take response and convert to json
			return response.json();
		}).then (restaurants => {
			//open transaction to write in restaurants
			dbPromise.then(function (db) {
				if (!db) return;
				let tx = db.transaction('restaurants', 'readwrite');
				let store = tx.objectStore('restaurants');
				//place each restaurant in DB
				restaurants.forEach(restaurant => {
					store.put(restaurant);
				});
				return tx.complete;
			});
		});
}

function storeReviews() {
	let dbPromise = DBHelper.openDB();
	//retrieve json
	fetch(`${DBHelper.REVIEW_URL}`, {method: 'GET'})
		.then(response => {
			//get response and return as json
			return response.json();
			//place json
		}).then (reviews => {
			//take reviews, use database transaction to write reviews in db
			dbPromise.then(function (db) {
				if (!db) return;
				let tx = db.transaction('reviews', 'readwrite');
				let store = tx.objectStore('reviews');
				//place each restaurant in DB
				reviews.forEach(review => {
					store.put(review);
					//put into db
				});
				return tx.complete;
			});
		});
}

//steps in order
DBHelper.openDB()
	.then(storeRestaurants())
	.then(storeReviews())
	.catch((err) => console.log(`IDB is unhappy and failed with ${err}`));
