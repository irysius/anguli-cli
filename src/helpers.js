var PATH = require('path');
var fs = require('@irysius/utils').fs;
var _ = require('lodash');

function isNodeApplication(cwd) {
	return fs.stat(PATH.resolve(cwd, 'package.json')).then(stat => {
		return !!stat;
	});
}
function hasBowerJson(cwd) {
	return fs.stat(PATH.resolve(cwd, 'bower.json')).then(stat => {
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

function targetPathResolver(root) {
	function srcFile(filename = '') {
		return PATH.resolve(root, 'src', filename);
	}
	function rootFile(filename = '') {
		return PATH.resolve(root, filename);
	}
	function controllerFile(filename = '') {
		return PATH.resolve(root, 'src', 'api', 'controllers', filename);
	}
	function hubFile(filename = '') {
		return PATH.resolve(root, 'src', 'api', 'hubs', filename);
	}
	function modelFile(filename = '') {
		return PATH.resolve(root, 'src', 'api', 'models', filename);
	}
	function viewFile(filename = '') {
		return PATH.resolve(root, 'src', 'views', filename);
	}
	function schemaFile(filename = '') {
		return PATH.resolve(root, 'src', 'api', 'schemas', filename);
	}
	return {
		srcFile: srcFile,
		rootFile: rootFile,
		controllerFile: controllerFile,
		hubFile: hubFile,
		modelFile: modelFile,
		viewFile: viewFile,
		schemaFile: schemaFile
	};
}

function templateWriter(src, target, context, { override = false } = {}) {
	if (!override) {
		return fs.stat(target).then(stat => {
			if (!stat) {
				return writeFile(src, target, context);
			} else {
				console.info('templateWriter');
				console.info('Already exists: ' + target);
			}
 		});
	} else {
		return writeFile(src, target, context);
	}

	function writeFile(src, target, context) {
		console.info('templateWriter');
		console.info('> ' + src);
		console.info('> ' + target);
		return fs.readFile(src, { encoding: 'utf8' }).then(data => {
			return fs.assertFolder(PATH.dirname(target)).then(() => {
				return fs.writeFile(target, _.template(data)(context));
			});
		});
	}
}
function templateCopier(src, target, { override = false } = {}) {
	if (!override) {
		return fs.stat(target).then(stat => {
			if (!stat) {
				return copyFile(src, target);
			} else {
				console.info('templateCopier');
				console.info('Already exists: ' + target);
			}
 		});
	} else {
		return copyFile(src, target);
	}

	function copyFile(src, target) {
		console.info('templateCopier');
		console.info('> ' + src);
		console.info('> ' + target);
		return fs.assertFolder(PATH.dirname(target)).then(() => {
			return fs.copyFile(src, target);
		});
	}
}

module.exports = {
	isNodeApplication: isNodeApplication,
	hasBowerJson: hasBowerJson,
	hasExistingInstall: hasExistingInstall,
	targetPathResolver: targetPathResolver,
	templateWriter: templateWriter,
	templateCopier: templateCopier
};