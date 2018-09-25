
// Service Worker

let projectCache = 'version4';
const cacheFiles = [
	'./',
	'./index.html',
	'./restaurant.html',
	'./img/',
	'./image/',
	'./css/styles.css',
	'./js/main.js',
	'./js/restaurant_info.js',
	'./js/dbhelper.js',
	'./manifest.json',
	'./sw.js',
	'./js/idb-lib.js',
	'./img/1_small.jpg',
	'./img/2_small.jpg',
	'./img/3_small.jpg',
	'./img/4_small.jpg',
	'./img/5_small.jpg',
	'./img/6_small.jpg',
	'./img/7_small.jpg',
	'./img/8_small.jpg',
	'./img/9_small.jpg',
	'./img/10_small.jpg',
	'./img/1_large.jpg',
	'./img/2_large.jpg',
	'./img/3_large.jpg',
	'./img/4_large.jpg',
	'./img/5_large.jpg',
	'./img/6_large.jpg',
	'./img/7_large.jpg',
	'./img/8_large.jpg',
	'./img/9_large.jpg',
	'./img/10_large.jpg'
];

// install the service worker
self.addEventListener('install', (event) => {
	// install steps wait until version is opened and cache
	event.waitUntil(
		caches.open(projectCache).then((cache) => {
			//console.log('SW Cache is installing');
			//opened and use cache.addAll to add files
			return cache.addAll(cacheFiles);
		}).then((skip) => {
			//console.log('Service Worker Skip waiting');
			self.skipWaiting();
			//console.log('Service Worker properly installed');
			return skip;
		}).catch((error) => {
			// install failed
			console.log('SW Open & Cache install failed with ' + error);
		})
	);
});

// activate service worker
self.addEventListener('activate', (event) => {
	//success!
	event.waitUntil(
		caches.keys().then((projectCaches) => {
			return Promise.all(projectCaches.map((cache) => {
				//if cache versions to not match, delete old version
				if (cache !== projectCache) {
					//console.log('Service Worker Removing Cache version');
					return caches.delete(cache);
				}
			}));
		})
	);
});

// fetch service worker
self.addEventListener('fetch', (event) => {
	// fetch steps
	let request = event.request;
	//do not cache JSON in service worker
	event.respondWith (
		//match requests to cache, including pages on demand
		caches.match(request, {ignoreSearch: true}).then((response) => {
			if (response) {
				//return cached files
				//console.log('[ServiceWorker] found in cache', event.request);
				return response;
			}
			//clone request
			let fetchRequest = request.clone();

			return fetch(fetchRequest).then(
				(response) => {
					//check valid response basic means we do NOT cache 3rd party responses
					if(!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}
					let responseToCache = response.clone();

					caches.open(projectCache)
						.then((cache) => {
							cache.put(request, responseToCache);
						});
					return response;
				}
			);
		})
	);
});