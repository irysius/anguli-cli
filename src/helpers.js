var PATH = require('path');
var fs = require('@irysius/utils').fs;

function isNodeApplication(cwd) {
	return fs.stat(PATH.resolve(cwd, 'package.json')).then(stat => {
		return !!stat;
	});
}
function hasExistingInstall(cwd) {
	// The only files we're checking as proof of installation
	var telltaleFiles = ['main.js', 'server.js', 'context.js'];
	var fileExistPromises = telltaleFiles
		.map(f => PATH.resolve(cwd, 'src', f))
		.map(f => fs.stat(f));
	
	return Promise.all(fileExistPromises).then(stats => {
		return stats.every(stat => !!stat);
	});
}

module.exports = {
	isNodeApplication: isNodeApplication,
	hasExistingInstall: hasExistingInstall
};