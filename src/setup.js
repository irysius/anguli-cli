var inquirer = require('inquirer');
var h = require('./helpers');

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
	{ package: '@irysius/anguli-components', version: '0.1.x' }	
];

var utilityDependencies = [
	{ package: 'lodash', version: '' },
	{ package: 'moment', version: '' },
	{ package: 'chance', version: '' }	
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
			return inquirer.prompt([hasExistingInstall]).then(({ proceed }) => {
				if (!proceed) { throw new Error(); }
			});
		}
	}).then(() => {
		var options = [optionHub, optionSessions, optionIdentity, optionModels];
		console.log('Setting up the anguli framework...');
		return inquirer.prompt(options).then(({hubs, sessions, identities, models}) => {
			// Do stuff
			console.log(hubs);
			console.log(sessions);
			console.log(identities);
			console.log(models);
		});
	}).catch(() => {});
	
}

module.exports = setup;