var PATH = require('path');
var fs = require('@irysius/utils').fs;

function assert(packageJsonPath, dependencies, isDev = false) {
	var dependencyKey = isDev ? 'devDependencies' : 'dependencies';
	return fs.readFile(packageJsonPath).then(data => {
		return JSON.parse(data);
	}).then(data => {
		
		if (!data[dependencyKey]) {
			data[dependencyKey] = {};
		}

		dependencies.forEach(d => {
			if (!data[dependencyKey][d.package]) {
				data[dependencyKey][d.package] = d.version;
			}
		});
		
		return data;
	}).then(data => {
		var text = JSON.stringify(data, null, '  ');
		text = text.replace(/\r\n/g, '\n');
		return fs.writeFile(packageJsonPath, text);
	});
}

module.exports = {
	assert: assert
};