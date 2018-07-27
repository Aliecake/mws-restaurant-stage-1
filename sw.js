

// Service Worker

let projectCache = 'Vez3';
const cacheFiles = [
	'./',
	'./index.html',
	'./restaurant.html',
	'./img/',
	'./css/styles.css',
	'./js/main.js',
	'./js/restaurant_info.js',
	'./js/dbhelper.js',
	'./manifest.json'
];

// install the service worker
self.addEventListener('install', (event) => {
	// install steps wait until version is opened and cache
	event.waitUntil(
		caches.open(projectCache).then((cache) => {
			console.log('SW Cache is installing');
			//opened and use cache.addAll to add files
			return cache.addAll(cacheFiles);
		}).then((skip) => {
			console.log('Service Worker Skip waiting');
			self.skipWaiting();
			console.log('Service Worker properly installed');
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
	console.log('Activate Event');
	event.waitUntil(
		caches.keys().then((projectCaches) => {
			return Promise.all(projectCaches.map((cache) => {
				//if cache versions to not match, delete old version
				if (cache !== projectCache) {
					console.log('Service Worker Removing Cache version');
					return caches.delete(cache);
				}
			}));
		})
	);
});

// fetch service worker THIS IS FAILING to catch & fetch
self.addEventListener('fetch', (event) => {
	// fetch steps
	console.log('Fetch event');

	let request = event.request;

	event.respondWith (
		//match requests to cache, including pages on demand
		caches.match(request, {ignoreSearch: true}).then((response) => {
			if (response) {
				//return cached files
				console.log('[ServiceWorker] found in cache', event.request);
				return response;
			} else {
			//if request is not in cache, add it
				return fetch(request).then((response) => {
					let toCache = response.clone();
					caches.open(projectCache).then((cache) => {
						cache.put(request, toCache).catch((err) => {
							console.warn(request.url + err);
						});
					});
					return response;
				});
			}
		})
	);
});