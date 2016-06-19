var PATH = require('path');
var fs = require('@irysius/utils').fs;

function isNodeApplication(cwd) {
	return fs.stat(PATH.resolve(cwd, 'package.json')).then(stat => {
		return !!stat;
	});
}
function hasExistingInstall(cwd) {
	var telltaleFiles = ['main.js', 'server.js', 'context.js'];
	return fs.listFiles(PATH.resolve(cwd, 'src')).then(files => {
		var fileNames = files.filter(file => PATH.basename(file).toLowerCase());
		return fileNames.some(fileName => telltaleFiles.indexOf(fileName) !== -1);
	});
}

module.exports = {
	isNodeApplication: isNodeApplication,
	hasExistingInstall: hasExistingInstall
};