/* globals __dirname */
if (typeof Promise === 'undefined') {
	require('babel-polyfill');
	console.info('Using babel-polyfill');
}

var context = require('./context');
context.initialize().then(() => {
	try {
		require('./server');
	} catch (e) {
		console.error('Unhandled error occurred in the application');
		console.error(e.message);
	}
}).catch((e) => {
	console.error('Error occurred initializing context objects.');
	console.error(e.message);
});