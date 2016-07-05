/* globals __dirname */
// Node 4.x's implementation of promises is lacking
GLOBAL.Promise = require('bluebird');

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