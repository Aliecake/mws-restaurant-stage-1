let restaurant;
var newMap;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	initMap();
});
/**
	* Initialize Leaflet map, called from HTML.added window to init
	*/
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoiYWxpZWNha2UiLCJhIjoiY2ppYW9pdzZxMGIweTNwbzdrbW82amJwYSJ9.t83apE-NLoi0dvupLaxFlg',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
				'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		}
	});
};

/*
	* Get current restaurant from page URL.
	*/
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};
/**
	* Create restaurant HTML and add it to the webpage
	*set alt tags for images.
	*/
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg', '') + '_large.jpg';
	image.alt = `Picture of ${restaurant.name} restaurant`;
	const faveButton = document.createElement('button');
	faveButton.setAttribute('role', 'button');
	faveButton.setAttribute('name', 'favorite button');
	faveButton.setAttribute('aria-label', 'Add to Favorites');
	const i = document.createElement('i');
	//get favorite status so current status will show
	getClass = () => {
		if(PerformanceEntry) {
			let pageNav = performance.getEntriesByType('navigation')[0];
			let isReloaded = pageNav.type;
			//if page is reloaded, update IndexedDB appropiately.
			if(isReloaded == 'reload') {
				//get local storage key & value, and place in IDB when user comes back online.
				for(var i = 0, length = localStorage.length; i < length; i++) {
					var key = localStorage.key(i);
					var value = localStorage[key];
					DBHelper.setFavorite(value, key);
				}
			}
		}
		let stringID = JSON.stringify(restaurant.id);
		let response = localStorage.getItem(stringID, 'true');
		if(response == 'true' || restaurant.is_favorite == 'true') {
			let id = restaurant.id;
			let truthy = true;
			faveButton.setAttribute('aria-label', 'is a favorite');
			faveButton.setAttribute('name', 'is a favorite');
			DBHelper.localStorageFavorite(truthy, id);
			return 'button favorite-button favorited';
		}
		else {
			faveButton.setAttribute('aria-label', 'is not a favorite');
			faveButton.setAttribute('name', 'is not a favorite');
			return 'button favorite-button';
		}
	};
	faveButton.setAttribute('class', getClass());
	faveButton.setAttribute('tabindex', '0');
	faveButton.setAttribute('onClick', 'favorite()');
	i.className = 'fa fa-heart';
	//function for button onclick
	favorite = () => {
		//toggles the class of the button
		faveButton.classList.toggle('favorited');
		let id = restaurant.id;
		//restaurant.is_favorite string comparison doesnt work here
		if (faveButton.className === 'button favorite-button favorited') {
			faveButton.setAttribute('name', 'is a favorite');
			let truthy = true;
			DBHelper.localStorageFavorite(truthy, id);
			DBHelper.setFavorite(truthy, id);
		}
		else {
			let truthy = false;
			faveButton.setAttribute('name', 'is not a favorite');
			DBHelper.localStorageFavorite(truthy, id);
			DBHelper.setFavorite(truthy, id);
		}
	};
	name.append(faveButton);
	faveButton.append(i);
	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;
	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews without closing transaction
	DBHelper.fetchReviews(restaurant.id, fillReviewsHTML);
};
/**
	* Create restaurant operating hours HTML table and add it to the webpage.
	*/
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
	* Create all reviews HTML and add them to the webpage.
	*/


fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h2');
	//add href to skip to add review
	title.innerHTML = 'Reviews';
	container.appendChild(title);
	if(PerformanceEntry) {
		let pageNav = performance.getEntriesByType('navigation')[0];
		let isReloaded = pageNav.type;
		//if page is reloaded, update IndexedDB appropiately.
		if(isReloaded == 'reload') {
			//get local storage key & value, and place in IDB when user comes back online.
			for(var i = 0, length = localStorage.length; i < length; i++) {
				const key = localStorage.key(i);
				const offlineValue = JSON.parse(localStorage[key]);
				//take the value and create variables
				const review = offlineValue.comments;
				const id = offlineValue.restaurant_id;
				const name = offlineValue.name;
				const myEpoch = offlineValue.updatedAt;
				const rating = offlineValue.rating;

				DBHelper.saveReview(id, name, myEpoch, review, rating);
				setTimeout(function(){
					console.log('Deleting Keys');
					DBHelper.deleteKeys();
				}, 9000);
			}
		}
	}
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
	* Create review HTML and add it to the webpage.
	* Added class to style reviews
	*/
createReviewHTML = (review) => {
	let newDate = new Date(review.updatedAt * 1).toDateString();//converts epoch to a date and returns only month/day/year

	const li = document.createElement('li');
	const name = document.createElement('p');
	name.className = 'name';
	name.innerHTML = review.name;
	li.appendChild(name);

	const date = document.createElement('p');
	date.className = 'date';
	date.innerHTML = newDate;
	li.appendChild(date);

	const rating = document.createElement('p');
	rating.className = 'rating';
	rating.innerHTML = 'Rating: ';
	li.appendChild(rating);
	//show stars instead of rating number
	let count = 1;
	for (let i = 0; i < 5; i++) {
		if(`${review.rating}`>= count){
			const iconGold = document.createElement('i');
			iconGold.className = 'fa fa-star starred';
			rating.append(iconGold);
		} else {
			const iconBlack = document.createElement('i');
			iconBlack.className = 'fa fa-star';
			rating.append(iconBlack);
		}
		count++;
	}
	const comments = document.createElement('p');
	comments.className = 'comments';
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
};

submitReview = (restaurant = self.restaurant) => {
	const id = restaurant.id;
	const name = document.getElementById('name-form').value;
	const date = document.getElementById('date-form').value;
	const review = document.getElementById('review-input').value;
	const rating = document.querySelector('input[name=rating-input]:checked').value;
	var myDate = new Date(date);
	var myEpoch = myDate.getTime()/1;

	if(navigator.onLine) {
		//post review to IDB
		DBHelper.saveReview(id, name, myEpoch, review, rating, (error) => {
			console.log('review submitted');
			if (error) {
				console.log('review not saved with', error);
			}
		});
	}
	else {
		console.log('OFFLINE');
		//if offline post to local storage
		DBHelper.reviewLocalStorage(id, name, myEpoch, review, rating, (error) => {
			console.log('review submitted offline');
			if (error) {
				console.log('review not saved offline with', error);
			}
		});
	}
};

/**
	* Add restaurant name to the breadcrumb navigation menu
	*/
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
	* Get a parameter by name from page URL.
	*/
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
