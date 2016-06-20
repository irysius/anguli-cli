var _ = require('lodash');
var inquirer = require('inquirer');
var h = require('./helpers');
var fs = require('@irysius/utils').fs;
var PATH = require('path');
var dependency = require('./dependency');

var invalidDirectory = 'anguli setup is expected to run in the root of a node project. Please re-run the command in a directory with a package.json.';
var existingInstallation = {
	type: 'confirm',
	name: 'proceed',
	message: 'anguli setup detects an existing installation in this project. anguli will not override existing files. Do you wish to continue?' 	
};

var optionHub = {
	type: 'confirm',
	name: 'hubs',
	message: 'Will your application need socket hubs?' 
};
var optionModels = {
	type: 'confirm',
	name: 'models',
	message: 'Will your application need an ORM?' 	
};
var optionSessions = {
	type: 'confirm',
	name: 'sessions',
	message: 'Will your application need sessions?'
};
var optionIdentity = {
	type: 'confirm',
	name: 'identities',
	message: 'Will your application need to track user identities?'
};

var setupComplete = 'anguli setup has completed installing project files. Please run npm install to finish installing external dependencies.';

var dependencies = [
	{ package: '@irysius/utils', version: '0.1.x' },
	{ package: '@irysius/anguli-components', version: '0.1.x' },
	{ package: '@irysius/schema-service', version: '0.1.x' },
	{ package: '@irysius/config-manager', version: '0.1.x' },
	{ package: '@irysius/file-config-service', version: '0.1.x' },
];

var utilityDependencies = [
	{ package: 'lodash', version: '4.13.x' },
	{ package: 'moment', version: '2.13.x' },
	{ package: 'chance', version: '1.0.x' }	
];

var baseDependencies = [
	{ package: 'express', version: '4.13.4' },
	{ package: 'body-parser', version: '1.14.2' },
	{ package: 'compression', version: '1.6.1' },
	{ package: 'cookie-parser', version: '1.4.1' },
	{ package: 'cors', version: '2.7.1' },
	{ package: 'errorhandler', version: '1.4.3' },
	{ package: 'method-override', version: '2.3.5' },
	{ package: 'multer', version: '1.1.0' },
	{ package: 'ejs', version: '2.4.1' }
];

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function writeMain(context) {
	var targetFile = PATH.resolve(context.cwd, 'src', 'main.js'); 
	return fs.stat(targetFile).then(stat => {
		if (!stat) {
			return fs.copyFile(templateFile('main.js.ejs'), targetFile);
		}
	});	
}

function writeServer(context) {
	var targetFile = PATH.resolve(context.cwd, 'src', 'server.js');
	return fs.stat(targetFile).then(stat => {
		if (!stat) {
			return fs.readFile(templateFile('server.js.ejs')).then(data => {
				return fs.writeFile(targetFile, _.template(data)(context));
			});
		}
	});
}

function writeContext(context) {
	var targetFile = PATH.resolve(context.cwd, 'src', 'context.js');
	return fs.stat(targetFile).then(stat => {
		if (!stat) {
			return fs.readFile(templateFile('context.js.ejs')).then(data => {
				return fs.writeFile(targetFile, _.template(data)(context));
			});
		}
	});
}

function writeConfig(context) {
	var targetFile = PATH.resolve(context.cwd, 'config.json');
	return fs.stat(targetFile).then(stat => {
		if (!stat) {
			return fs.copyFile(templateFile('config.json'), targetFile);
		}
	});
}

function setup(context) {
	// Begin main logic
	return h.isNodeApplication(context.cwd).then(yes => {
		if (!yes) { 
			console.error(invalidDirectory);
			throw new Error(); 
		}
		return h.hasExistingInstall(context.cwd);
	}).then(yes => {
		if (yes) { 
			return inquirer.prompt([existingInstallation]).then(({ proceed }) => {
				if (!proceed) { throw new Error(); }
			});
		}
	}).then(() => {
		var options = [optionHub, optionSessions, optionIdentity, optionModels];
		console.log('Setting up the anguli framework...');
		return inquirer.prompt(options).then(({hubs, sessions, identities, models}) => {
			// Do stuff
			var base = {
				needsHub: hubs,
				needsSession: sessions,
				needsIdentity: identities,
				needsModel: models
			};

			if (hubs) { dependencies.push({ package: 'socket.io', version: '1.4.6' }); }
			if (models) { dependencies.push({ package: 'waterline', version: '0.1.4' }); }
			var renderContext = _.merge(base, context);

			return Promise.all([
				writeMain(renderContext),
				writeServer(renderContext),
				writeContext(renderContext),
				writeConfig(renderContext)
			]);
		}).then(() => {
			var packageJson = PATH.resolve(context.cwd, 'package.json');
			dependency.assert(packageJson, baseDependencies);
		});
	}).catch(e => { console.log(e.stack); console.log(e.message) });
	
}

module.exports = setup;